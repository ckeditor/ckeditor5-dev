/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const transifexAPI = require( './transifex-api' );
const collectUtils = require( './collect-utils' );
const gettextParser = require( 'gettext-parser' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const fs = require( 'fs-extra' );
const path = require( 'path' );

/**
 * Downloads translations from the transifex for each package and language.
 *
 *		Gulp usage:
 *		gulp translations:download -u someUsername -p somePassword
 *
 * @param {Object} config
 * @param {String} config.username
 * @param {String} config.password
 */
module.exports = function download( config ) {
	const languages = [ 'en' ];

	const packageNames = [ ...collectUtils.getContexts().keys() ];

	const packagePoFilePromises = packageNames.map( ( packageName ) => {
		return downloadAndSavePoFilesForPackage( config, languages, packageName );
	} );

	return Promise.all( packagePoFilePromises )
		.then( () => logger.info( '\nSUCCESS\n' ) )
		.catch( ( err ) => logger.error( err ) );
};

function downloadAndSavePoFilesForPackage( config, languages, packageName ) {
	const poFileForPackagePromise = languages.map( lang => {
		const transifexDownloadConfig = Object.assign( {}, config, {
			lang,
			slug: packageName
		} );

		const parsedPoFilePromise = downloadAndParsePoFile( transifexDownloadConfig );
		const pathToSave = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', lang + '.json' );

		return parsedPoFilePromise.then( ( parsedPoFiles ) => {
			fs.outputFileSync( pathToSave, JSON.stringify( parsedPoFiles, null, 4 ) );
			logger.info( `Saved ${ lang }.json at ${ path.dirname( pathToSave ) }` );
		} );
	} );

	return Promise.all( poFileForPackagePromise );
}

function downloadAndParsePoFile( transifexDownloadConfig ) {
	return downloadPoFile( transifexDownloadConfig )
		.then( ( poFileContent ) => gettextParser.po.parse( poFileContent ) )
		.then( ( json ) => getCorrectTranslationFormat( json.translations ) )
		.catch( ( err ) => logger.error( err ) );
}

// @param {Object} config
// @param {String} config.username
// @param {String} config.password
// @param {String} config.slug
// @param {String} config.lang
// @returns {Promise<String>}
function downloadPoFile( config ) {
	return transifexAPI.getTranslation( config ).then( ( data ) => {
		const { content } = JSON.parse( data );
		logger.info( `Downloaded ${ config.lang } language for ${ config.slug }` );

		return content;
	} );
}

function getCorrectTranslationFormat( translations ) {
	return Object.keys( translations )
		.filter( key => !!key )
		.map( ( key ) => translations[key] )
		.map( ( obj ) => obj[ Object.keys( obj )[0] ] );
}
