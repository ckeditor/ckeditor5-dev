/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const transifexService = require( './transifex-service' );
const Table = require( 'cli-table' );
const chalk = require( 'chalk' );

/**
 * Uploads translations to the Transifex from collected files that are saved at 'ckeditor5/build/.transifex'.
 *
 * @param {Object} loginConfig
 * @param {String} config.token Token to the Transifex API.
 */
module.exports = function upload( loginConfig ) {
	const cwd = process.cwd().split( path.sep ).join( path.posix.sep );
	const pathToPoTranslations = path.posix.join( cwd, 'build', '.transifex' );
	const potFiles = fs.readdirSync( pathToPoTranslations ).map( packageName => ( {
		packageName,
		path: path.posix.join( pathToPoTranslations, packageName, 'en.pot' )
	} ) );
	const summaryCollection = {
		created: [],
		updated: []
	};

	return Promise.resolve()
		.then( () => transifexService.getResources( loginConfig ) )
		.then( resources => resources.map( resource => resource.slug ) )
		.then( uploadedPackageNames => getUploadedPackages( potFiles, uploadedPackageNames ) )
		.then( areUploadedResources => createOrUpdateResources( loginConfig, areUploadedResources, potFiles, summaryCollection ) )
		.then( () => {
			logger.info( 'All resources uploaded.\n' );

			printSummary( summaryCollection );
		} )
		.catch( err => {
			logger.error( err );
			throw err;
		} );
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
	const resConfig = Object.assign( {}, config, {
		name: packageName,
		slug: packageName,
		content: fs.createReadStream( path )
	} );

	logger.info( `Processing "${ packageName }"...` );

	if ( isUploadedResource ) {
		return transifexService.putResourceContent( resConfig )
			.then( parsedResponse => {
				summaryCollection.updated.push( [ packageName, parsedResponse ] );
			} );
	}

	return transifexService.postResource( resConfig )
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
			table.push( [ packageName, response[ 0 ] ] );
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
			table.push( [ packageName, response.strings_added, response.strings_updated, response.strings_delete ] );
		}

		for ( const [ packageName, response ] of nonChangedItems ) {
			const rowData = [ packageName, response.strings_added, response.strings_updated, response.strings_delete ];

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
