/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const transifexService = require( './transifex-service' );

/**
 * Uploads source files to the Transifex from collected files that are saved in the 'ckeditor5/build/.transifex' directory.
 *
 * @param {Object} loginConfig
 * @param {String} config.token Token to the Transifex API.
 */
module.exports = function uploadSourceFiles( loginConfig ) {
	const pathToPoTranslations = path.join( process.cwd(), 'build', '.transifex' );
	const potFiles = fs.readdirSync( pathToPoTranslations ).map( packageName => ( {
		packageName,
		path: path.join( pathToPoTranslations, packageName, 'en.pot' )
	} ) );

	return Promise.resolve()
		.then( () => transifexService.getResources( loginConfig ) )
		.then( resources => resources.map( resource => resource.slug ) )
		.then( uploadedPackageNames => getUploadedPackages( potFiles, uploadedPackageNames ) )
		.then( areUploadedResources => createOrUpdateResources( loginConfig, areUploadedResources, potFiles ) )
		.then( () => logger.info( 'All resources uploaded.\n' ) )
		.catch( err => {
			logger.error( err );
			throw err;
		} );
};

function getUploadedPackages( potFiles, uploadedPackageNames ) {
	return potFiles.map( potFile => uploadedPackageNames.includes( potFile.packageName ) );
}

function createOrUpdateResources( loginConfig, areUploadedResources, potFiles ) {
	return Promise.all(
		areUploadedResources.map( ( isUploadedResource, index ) => {
			return createOrUpdateResource( loginConfig, potFiles[ index ], isUploadedResource );
		} )
	);
}

function createOrUpdateResource( config, potFile, isUploadedResource ) {
	const { packageName, path } = potFile;
	const resConfig = Object.assign( {}, config, {
		name: packageName,
		slug: packageName,
		content: fs.createReadStream( path )
	} );

	if ( isUploadedResource ) {
		return transifexService.putResourceContent( resConfig )
			.then( parsedResponse => logPutResponse( packageName, parsedResponse ) );
	}

	return transifexService.postResource( resConfig )
		.then( parsedResponse => logPostResponse( packageName, parsedResponse ) );
}

function logPutResponse( packageName, parsedResponse ) {
	logger.info( `Package: ${ packageName }` );
	logger.info( `New: ${ parsedResponse.strings_added }` );
	logger.info( `Updated: ${ parsedResponse.strings_updated }` );
	logger.info( `Deleted: ${ parsedResponse.strings_delete }` );
	logger.info( '-------------------------------' );
}

function logPostResponse( packageName, parsedResponse ) {
	logger.info( `Package: ${ packageName }` );
	logger.info( `New: ${ parsedResponse[ 0 ] }` );
	logger.info( '-------------------------------' );
}
