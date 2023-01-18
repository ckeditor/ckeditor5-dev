/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs/promises' );
const path = require( 'path' );
const Table = require( 'cli-table' );
const chalk = require( 'chalk' );
const transifexService = require( './transifexservice' );
const { verifyProperties, createLogger } = require( './utils' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const RESOURCE_REGEXP = /r:(?<resourceName>[a-z0-9_-]+)$/i;

const TRANSIFEX_RESOURCE_ERRORS = {};

/**
 * Uploads translations to the Transifex.
 *
 * The process for each package looks like the following:
 *  * If a package does not exist on Tx - create it.
 *  * Upload a new source file for the given package (resource).
 *  * Verify Tx response.
 *
 * At the end, the script displays a summary table.
 *
 * The Transifex API may end with an error at any stage. In such a case, the resource is not processed anymore.
 * It is saved to a file (`.transifex-failed-uploads.json`). Rerunning the script will process only packages specified in the file.
 *
 * @param {Object} config
 * @param {String} config.token Token to the Transifex API.
 * @param {String} config.organizationName Name of the organization to which the project belongs.
 * @param {String} config.projectName Name of the project for downloading the translations.
 * @param {String} config.cwd Current work directory.
 * @param {Map.<String,String>} config.packages A resource name -> package path map for which translations should be uploaded.
 * @returns {Promise}
 */
module.exports = async function upload( config ) {
	verifyProperties( config, [ 'token', 'organizationName', 'projectName', 'cwd', 'packages' ] );

	const logger = createLogger();
	const pathToFailedUploads = path.join( config.cwd, '.transifex-failed-uploads.json' );
	const isFailedUploadFileAvailable = await isFile( pathToFailedUploads );

	// When rerunning the task, it is an array containing names of packages that failed.
	let failedPackages = null;

	// Check if rerunning the same task again.
	if ( isFailedUploadFileAvailable ) {
		logger.warning( 'Found the file containing a list of packages that failed during the last script execution.' );
		logger.warning( 'The script will process only packages listed in the file instead of all passed as "config.packages".' );

		failedPackages = Object.keys( require( pathToFailedUploads ) );
	}

	logger.progress( 'Fetching project information...' );

	transifexService.init( config.token );

	const localizablePackageNames = [ ...config.packages.keys() ];
	const { organizationName, projectName } = config;

	// Find existing resources on Transifex.
	const projectData = await transifexService.getProjectData( organizationName, projectName, localizablePackageNames )
		.catch( () => {
			logger.error( `Cannot find project details for "${ organizationName }/${ projectName }".` );
			logger.error( 'Make sure you specified a valid auth token or an organization/project names.' );
		} );

	if ( !projectData ) {
		return Promise.resolve();
	}

	// Then, prepare a map containing all resources to upload.
	// The map defines a path to the translation file for each package.
	// Also, it knows whether the resource exists on Tx. If don't, a new one should be created.
	const resourcesToUpload = new Map(
		[ ...config.packages ].map( ( [ resourceName, relativePath ] ) => ( [
			resourceName,
			{
				potFile: path.join( config.cwd, relativePath, 'en.pot' ),
				isNew: !projectData.resources.find( item => item.attributes.name === resourceName )
			}
		] ) )
	);

	logger.progress( 'Uploading new translations...' );

	const uploadIds = [];

	// For each package, create a new resource if needed, then upload the new source file with translations.
	for ( const [ resourceName, { potFile, isNew } ] of resourcesToUpload ) {
		// The package should be processed unless the previous run failed and isn't specified in the failed packages collection.
		if ( failedPackages && !failedPackages.includes( resourceName ) ) {
			continue;
		}

		const spinner = tools.createSpinner( `Processing "${ resourceName }"`, { indentLevel: 1, emoji: '👉' } );
		spinner.start();

		// For new packages, before uploading their translations, we need to create a dedicated resource.
		if ( isNew ) {
			await transifexService.createResource( { organizationName, projectName, resourceName } )
				.catch( errorHandlerFactory( resourceName, spinner ) );
		}

		// Abort if creating the resource ended with an error.
		if ( hasError( resourceName ) ) {
			continue;
		}

		const content = await fs.readFile( potFile, 'utf-8' );

		await transifexService.createSourceFile( { organizationName, projectName, resourceName, content } )
			.then( uuid => {
				uploadIds.push( { resourceName, uuid } );
				spinner.finish();
			} )
			.catch( errorHandlerFactory( resourceName, spinner ) );
	}

	// An empty line for making a space between list of resources and the new process info.
	logger.progress();

	// Chalk supports chaining which is hard to mock in tests. Let's simplify it.
	const takeWhileText = chalk.gray( 'It takes a while.' );
	const spinner = tools.createSpinner( chalk.cyan( 'Collecting responses...' ) + ' ' + chalk.italic( takeWhileText ) );

	spinner.start();

	const uploadDetails = uploadIds.map( async ( { resourceName, uuid } ) => {
		return transifexService.getResourceUploadDetails( uuid )
			.catch( errorHandlerFactory( resourceName ) );
	} );

	const summary = ( await Promise.all( uploadDetails ) )
		.filter( Boolean )
		.map( extractResourceDetailsFromTx( resourcesToUpload ) )
		.sort( sortResources() )
		.map( formatTableRow() );

	spinner.finish();

	logger.progress( 'Done.' );

	if ( summary.length ) {
		const table = new Table( {
			head: [ 'Package name', 'Is new?', 'Added', 'Updated', 'Removed' ],
			style: { compact: true }
		} );

		table.push( ...summary );

		logger.info( table.toString() );
	}

	if ( hasError() ) {
		// An empty line for making a space between steps and the warning message.
		logger.info( '' );
		logger.warning( 'Not all translations were uploaded due to errors in Transifex API.' );
		logger.warning( `Review the "${ chalk.underline( pathToFailedUploads ) }" file for more details.` );
		logger.warning( 'Re-running the script will process only packages specified in the file.' );

		await fs.writeFile( pathToFailedUploads, JSON.stringify( TRANSIFEX_RESOURCE_ERRORS, null, 2 ) + '\n', 'utf-8' );
	}
	// If the `.transifex-failed-uploads.json` file exists but the run has finished with no errors,
	// remove the file as it is not required anymore.
	else if ( isFailedUploadFileAvailable ) {
		await fs.unlink( pathToFailedUploads );
	}
};

/**
 * Returns a factory function that process a response from Transifex and prepares a single resource
 * to be displayed in the summary table.
 *
 * @param {Map} resourcesToUpload
 * @returns {Function}
 */
function extractResourceDetailsFromTx( resourcesToUpload ) {
	return response => {
		const { resourceName } = response.related.resource.id.match( RESOURCE_REGEXP ).groups;

		const { isNew } = resourcesToUpload.get( resourceName );
		const created = response.attributes.details.strings_created;
		const updated = response.attributes.details.strings_updated;
		const deleted = response.attributes.details.strings_deleted;

		return {
			resourceName,
			isNew,
			created,
			updated,
			deleted,
			changes: created + updated + deleted
		};
	};
}

/**
 * Returns a function that sorts a list of resources with the following criteria:
 *
 *  * New packages should be on top.
 *  * Then, packages containing changes.
 *  * Then, the rest of the packages (not ned and not containing changes).
 *
 * When all packages are grouped, they are sorted alphabetically.
 *
 * @returns {Function}
 */
function sortResources() {
	return ( first, second ) => {
		// Sort by "isNew".
		if ( first.isNew && !second.isNew ) {
			return -1;
		} else if ( !first.isNew && second.isNew ) {
			return 1;
		}

		// Then, sort by "has changes".
		if ( first.changes && !second.changes ) {
			return -1;
		} else if ( !first.changes && second.changes ) {
			return 1;
		}

		// Then, sort packages by their names.
		return first.resourceName.localeCompare( second.resourceName );
	};
}

/**
 * Returns a function that formats a row before displaying it. Each row contains five columns that
 * represent the following data:
 *
 *  (1) A resource name.
 *  (2) If the resource is new, the 🆕 emoji is displayed.
 *  (3) A number of added translations.
 *  (4) A number of modified translations (including removed).
 *  (5) A number of removed translations.
 *
 * Resources without changes are grayed out.
 *
 * @returns {Function}
 */
function formatTableRow() {
	return ( { resourceName, isNew, created, updated, deleted, changes } ) => {
		// Format a single row.
		const data = [ resourceName, isNew ? '🆕' : '', created.toString(), updated.toString(), deleted.toString() ];

		// For new resources or if it contains changes, use the default terminal color to print details.
		if ( changes || isNew ) {
			return data;
		}

		// But if it doesn't, gray out.
		return data.map( row => chalk.gray( row ) );
	};
}

/**
 * Returns `true` if the database containing error for the specified `packageName`.
 *
 * If the `packageName` is not specified, returns `true` if any error occurs.
 *
 * @param {String|null} [packageName=null]
 * @returns {Boolean}
 */
function hasError( packageName = null ) {
	if ( !packageName ) {
		return Boolean( Object.keys( TRANSIFEX_RESOURCE_ERRORS ).length );
	}

	return Boolean( TRANSIFEX_RESOURCE_ERRORS[ packageName ] );
}

/**
 * Creates a callback that stores errors from Transifex for the given `packageName`.
 *
 * @param {String} packageName
 * @param {CKEditor5Spinner|null} [spinner=null]
 * @returns {Function}
 */
function errorHandlerFactory( packageName, spinner ) {
	return errorResponse => {
		if ( spinner ) {
			spinner.finish( { emoji: '❌' } );
		}

		// The script does not continue to process a package if it fails.
		// Hence, we don't have to check do we override existing errors.
		TRANSIFEX_RESOURCE_ERRORS[ packageName ] = errorResponse.errors.map( e => e.detail );
	};
}

/**
 * @param {String} pathToFile
 * @returns {Promise.<Boolean>}
 */
function isFile( pathToFile ) {
	return fs.lstat( pathToFile )
		.then( () => true )
		.catch( () => false );
}
