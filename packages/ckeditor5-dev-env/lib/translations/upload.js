/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs/promises' );
const path = require( 'path' );
const Table = require( 'cli-table' );
const chalk = require( 'chalk' );
const transifexService = require( './transifex-service-for-api-v3.0' );
const { verifyProperties } = require( './utils' );
const { tools, logger: loggerFactory } = require( '@ckeditor/ckeditor5-dev-utils' );

const RESOURCE_REGEXP = /r:(?<resourceName>[a-z0-9_-]+)$/i;

/**
 * Uploads translations to the Transifex from collected files that are saved by default in the 'ckeditor5/build/.transifex' directory.
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
	const logger = loggerFactory();

	verifyProperties( config, [ 'token', 'organizationName', 'projectName', 'cwd', 'packages' ] );
	transifexService.init( config.token );

	logProcess( 'Fetching project information...' );

	const localizablePackageNames = [ ...config.packages.keys() ];
	const { organizationName, projectName } = config;

	// Find existing resources on Transifex.
	const { resources } = await transifexService.getProjectData( organizationName, projectName, localizablePackageNames );

	// Then, prepare a map containing all resources to upload.
	// The map defines a path to the translation file for each package.
	// Also, it knows whether the resource exists on Tx. If don't, a new one should be created.
	const resourcesToUpload = new Map(
		[ ...config.packages ].map( ( [ resourceName, relativePath ] ) => ( [
			resourceName,
			{
				potFile: path.join( config.cwd, relativePath, 'en.pot' ),
				isNew: !resources.find( item => item.attributes.name === resourceName )
			}
		] ) )
	);

	// An empty line for making a space between list of resources and the new process info.
	logProcess();
	logProcess( 'Uploading new translations...' );

	const uploadIds = [];

	// For each package, create a new resource if needed, then upload the new source file with translations.
	for ( const [ resourceName, { potFile, isNew } ] of resourcesToUpload ) {
		const spinner = tools.createSpinner( `Processing "${ resourceName }"`, { indentLevel: 1, emoji: '👉' } );
		spinner.start();

		// For new packages, before uploading their translations, we need to create a dedicated resource.
		if ( isNew ) {
			await transifexService.createResource( { organizationName, projectName, resourceName } );
		}

		const content = await fs.readFile( potFile, 'utf-8' );
		const taskId = await transifexService.createSourceFile( { organizationName, projectName, resourceName, content } );

		uploadIds.push( taskId );
		spinner.finish();
	}

	// Chalk supports chaining which is hard to mock in tests. Let's simplify it.
	const takeWhileText = chalk.gray( 'It takes a while.' );
	const spinner = tools.createSpinner( 'Collecting responses... ' + chalk.italic( takeWhileText ) );

	spinner.start();

	const uploadDetails = await Promise.all(
		uploadIds.map( async uuid => transifexService.getResourceUploadDetails( uuid ) )
	);

	spinner.finish();

	const summary = uploadDetails
		.map( extractResourceDetailsFromTx( resourcesToUpload ) )
		.sort( sortResources() )
		.map( formatTableRow() );

	logProcess( 'Done.' );

	const table = new Table( {
		head: [ 'Package name', 'Is new?', 'Added', 'Updated', 'Removed' ],
		style: { compact: true }
	} );

	table.push( ...summary );
	logger.info( table.toString() );

	/**
	 * @param {String} [message]
	 */
	function logProcess( message ) {
		if ( !message ) {
			logger.info( '' );
		} else {
			logger.info( '\n📍 ' + chalk.cyan( message ) );
		}
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
