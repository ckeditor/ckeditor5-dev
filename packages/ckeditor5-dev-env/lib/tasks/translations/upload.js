/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const transifexAPI = require( './transifex-api' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

/**
 * Adds translations to the Transifex.
 *
 * @param {Object} loginConfig
 * @param {String} loginConfig.username Username for the Transifex account.
 * @param {String} loginConfig.password Password for the Transifex account.
 */
module.exports = function upload( loginConfig ) {
	const pathToPoTranslations = path.join( process.cwd(), 'build', '.transifex' );
	const potFiles = fs.readdirSync( pathToPoTranslations ).map( ( packageName ) => ( {
		packageName,
		path: path.join( pathToPoTranslations, packageName, 'en.pot' )
	} ) );

	const resourceExistPromises = potFiles.map( ( potFile ) => {
		return transifexAPI.hasResource( Object.assign( {}, loginConfig, {
			slug: potFile.packageName,
		} ) );
	} );

	return Promise.all( resourceExistPromises ).then( ( resourcesExist ) => {
		return Promise.all( resourcesExist.map( ( resourceExists, index ) => {
			return createOrUpdateResource( loginConfig, potFiles[ index ], resourceExists );
		} ) );
	} )
	.then( () => logger.info( 'All resources uploaded.\n' ) )
	.catch( ( err ) => logger.error( err ) );
};

function createOrUpdateResource( config, potFile, resourceExists ) {
	const { packageName, path } = potFile;
	const resConfig = Object.assign( {}, config, {
		name: packageName,
		slug: packageName,
		content: fs.createReadStream( path )
	} );

	if ( resourceExists ) {
		return transifexAPI.putResourceContent( resConfig )
			.then( ( dataOrMessage ) => tryParsePutResponse( packageName, dataOrMessage ) );
	}

	return transifexAPI.postResource( resConfig )
		.then( ( dataOrMessage ) => tryParsePostResponse( packageName, dataOrMessage ) );
}

function tryParsePutResponse( packageName, dataOrMessage ) {
	try {
		const response = JSON.parse( dataOrMessage );
		logger.info( `Package: ${ packageName }` );
		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		logger.info( `New: ${ response.strings_added }` );
		logger.info( `Updated: ${ response.strings_updated }` );
		logger.info( `Deleted: ${ response.strings_delete }` );
		// jscs:enable requireCamelCaseOrUpperCaseIdentifiers
		process.stdout.write( '\n' );
	} catch ( err ) {
		throw new Error( dataOrMessage );
	}
}

function tryParsePostResponse( packageName, dataOrMessage ) {
	try {
		const [ newOnes ] = JSON.parse( dataOrMessage );
		logger.info( `Package: ${ packageName }` );
		logger.info( `New: ${ newOnes }` );
		process.stdout.write( '\n' );
	} catch ( err ) {
		throw new Error( dataOrMessage );
	}
}
