/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs/promises' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const Table = require( 'cli-table' );
const chalk = require( 'chalk' );
// const transifexService = require( './transifex-service' );
const transifexService = require( './transifex-service-for-api-v3.0' );
const { verifyProperties } = require( './utils' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

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
	// verifyProperties( config, [ 'token' ] );

	transifexService.init( config.token );

	logger.info( 'Fetching project information...' );

	const localizablePackageNames = [ ...config.packages.keys() ];

	const { organizationName, projectName } = config;

	// Find existing resources on Transifex.
	const { resources } = await transifexService.getProjectData(
		organizationName,
		projectName,
		localizablePackageNames
	);

	const resourcesToUpload = new Map();

	// Then, prepare a map containing all resources to upload.
	// The map defines a path to the translation file for each package.
	// Also, it knows whether the resource exists on Tx. If don't, a new one should be created.
	for ( const [ resourceName, relativePath ] of config.packages ) {
		resourcesToUpload.set( resourceName, {
			potFile: path.join( config.cwd, relativePath, 'en.pot' ),
			isNew: !resources.find( item => item.attributes.name === resourceName )
		} );
	}

	const summaryCollection = {
		created: [],
		updated: []
	};

	logger.info( 'Uploading new translations...' );

	const uploadIds = [];

	for ( const [ resourceName, { potFile, isNew } ] of resourcesToUpload ) {
		const spinner = tools.createSpinner( `Processing "${ resourceName }"...`, { indentLevel: 1 } );
		spinner.start();

		// For new packages, before uploading their translations, we need to create a dedicated resource.
		if ( isNew ) {
			await transifexService.createResource( { organizationName, projectName, resourceName } );
		}

		const content = await fs.readFile( potFile, 'utf-8' );

		const jobId = await transifexService.createSourceFile( { organizationName, projectName, resourceName, content } );

		uploadIds.push( jobId );
		spinner.finish();
	}

	logger.info( 'Collecting responses...' );

	const uploadDetails = await Promise.all(
		uploadIds.map( async uuid => transifexService.getResourceUploadDetails( uuid ) )
	);

	for ( const details of uploadDetails ) {
		
	}

	logger.info( 'Done.' );

	printSummary( summaryCollection );

	// // Make sure to use unix paths.
	// const pathToPoTranslations = config.translationsDirectory.split( /[\\/]/g ).join( '/' );
	//
	// const potFiles = fs.readdirSync( pathToPoTranslations ).map( packageName => ( {
	// 	packageName,
	// 	path: path.posix.join( pathToPoTranslations, packageName, 'en.pot' )
	// } ) );
	//

	//
	// return Promise.resolve()
	// 	.then( () => transifexService.getResources( config ) )
	// 	.then( resources => resources.map( resource => resource.slug ) )
	// 	.then( uploadedPackageNames => getUploadedPackages( potFiles, uploadedPackageNames ) )
	// 	.then( areUploadedResources => createOrUpdateResources( config, areUploadedResources, potFiles, summaryCollection ) )
	// 	.then( () => {
	// 		logger.info( 'All resources uploaded.\n' );
	//
	// 		printSummary( summaryCollection );
	// 	} )
	// 	.catch( err => {
	// 		logger.error( err );
	// 		throw err;
	// 	} );
};

function getUploadedPackages( potFiles, uploadedPackageNames ) {
	return potFiles.map( potFile => uploadedPackageNames.includes( potFile.packageName ) );
}

function createOrUpdateResources( loginConfig, areUploadedResources, potFiles, summaryCollection ) {
	return Promise.all(
		areUploadedResources.map( ( isUploadedResource, index ) => {
			return createOrUpdateResource( loginConfig, potFiles[ index ], isUploadedResource, summaryCollection );
		} )
	);
}

function createOrUpdateResource( config, potFile, isUploadedResource, summaryCollection ) {
	const { packageName, path } = potFile;
	const requestConfig = {
		url: config.url,
		token: config.token,
		name: packageName,
		slug: packageName,
		content: fs.createReadStream( path )
	};

	logger.info( `Processing "${ packageName }"...` );

	if ( isUploadedResource ) {
		return transifexService.putResourceContent( requestConfig )
			.then( parsedResponse => {
				summaryCollection.updated.push( [ packageName, parsedResponse ] );
			} );
	}

	return transifexService.postResource( requestConfig )
		.then( parsedResponse => {
			summaryCollection.created.push( [ packageName, parsedResponse ] );
		} );
}

function printSummary( summaryCollection ) {
	if ( summaryCollection.created.length ) {
		logger.info( chalk.underline( 'Created resources:' ) + '\n' );

		const table = new Table( {
			head: [ 'Package name', 'Added' ],
			style: { compact: true }
		} );

		const items = summaryCollection.created.sort( sortByPackageName() );

		for ( const [ packageName, response ] of items ) {
			table.push( [ packageName, response[ 0 ].toString() ] );
		}

		logger.info( table.toString() + '\n' );
	}

	if ( summaryCollection.updated.length ) {
		logger.info( chalk.underline( 'Updated resources:' ) + '\n' );

		const table = new Table( {
			head: [ 'Package name', 'Added', 'Updated', 'Removed' ],
			style: { compact: true }
		} );

		const changedItems = summaryCollection.updated
			.filter( item => ( item[ 1 ].strings_added + item[ 1 ].strings_updated + item[ 1 ].strings_delete ) > 0 )
			.sort( sortByPackageName() );

		const nonChangedItems = summaryCollection.updated
			.filter( item => !changedItems.includes( item ) )
			.sort( sortByPackageName() );

		for ( const [ packageName, response ] of changedItems ) {
			table.push( [
				packageName,
				response.strings_added.toString(),
				response.strings_updated.toString(),
				response.strings_delete.toString()
			] );
		}

		for ( const [ packageName, response ] of nonChangedItems ) {
			const rowData = [
				packageName,
				response.strings_added.toString(),
				response.strings_updated.toString(),
				response.strings_delete.toString()
			];

			table.push( rowData.map( item => chalk.gray( item ) ) );
		}

		logger.info( table.toString() );
	}

	function sortByPackageName() {
		return ( a, b ) => {
			/* istanbul ignore else */
			if ( a[ 0 ] < b[ 0 ] ) {
				return -1;
			} else if ( a[ 0 ] > b[ 0 ] ) {
				return 1;
			}

			/* istanbul ignore next */
			return 0;
		};
	}
}
