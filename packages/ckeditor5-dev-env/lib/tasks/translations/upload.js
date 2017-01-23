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
 * @param {Object} config
 * @param {String} config.username Username for the Transifex account.
 * @param {String} config.password Password for the Transifex account.
 */
module.exports = function upload( config ) {
	const pathToPoTranslations = path.join( process.cwd(), 'build', '.transifex' );
	const potFiles = fs.readdirSync( pathToPoTranslations ).map( ( packageName ) => ( {
		packageName,
		path: path.join( pathToPoTranslations, packageName, 'en.pot' )
	} ) );

	const firstTimeUploadPromises = potFiles.map( ( potFile ) => transifexAPI.getResource( {
		slug: potFile.packageName,
		username: config.username,
		password: config.password
	} ).then( () => false, () => true ) );

	return Promise.all( firstTimeUploadPromises ).then( ( firstTimeUploads ) => {
		return Promise.all( firstTimeUploads.map( ( firstTimeUpload, index ) => {
			return createOrUpdateResource( config, potFiles[ index ], firstTimeUpload );
		} ) );
	} )
	.then( () => logger.info( '\n\nSUCCESS\n' ) )
	.catch( ( err ) => logger.error( err ) );
};

function createOrUpdateResource( config, potFile, firstTimeUpload ) {
	const { packageName, path } = potFile;
	const resConfig = Object.assign( {}, config, {
		name: packageName,
		slug: packageName,
		content: fs.createReadStream( path )
	} );

	if ( firstTimeUpload ) {
		return transifexAPI.postResource( resConfig )
			.then( ( dataOrMessage ) => tryParsePostResponse( packageName, dataOrMessage ) );
	}

	return transifexAPI.putResourceContent( resConfig )
			.then( ( dataOrMessage ) => tryParsePutResponse( packageName, dataOrMessage ) );
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
