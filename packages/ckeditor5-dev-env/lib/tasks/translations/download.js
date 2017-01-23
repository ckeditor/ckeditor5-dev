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
 * Downloads translations from the Transifex for each package and language.
 *
 * @param {Object} config
 * @param {String} config.username Username for the Transifex account.
 * @param {String} config.password Password for the Transifex account.
 */
module.exports = function download( config ) {
	const languages = [ 'en', 'pl' ];

	const packageNames = [ ...collectUtils.getContexts().keys() ];

	const downlaodAndSaveTranslations = packageNames.map( ( packageName ) => {
		const translationPromises = downloadAndParsePoFilesForPackage( config, languages, packageName );

		return translationPromises.then( translations => {
			saveTranslations( packageName, translations );
		} );
	} );

	return Promise.all( downlaodAndSaveTranslations )
		.then( () => {
			logger.info( 'Saved all translations.' );
		} )
		.catch( ( err ) => {
			logger.error( err );
		} );
};

function downloadAndParsePoFilesForPackage( config, languages, packageName ) {
	const translationsForPackagePromise = languages.map( lang => {
		const transifexDownloadConfig = Object.assign( {}, config, {
			lang,
			slug: packageName
		} );

		return downloadAndParsePoFile( transifexDownloadConfig );
	} );

	return Promise.all( translationsForPackagePromise ).then( ( translationsForPackage ) => {
		const translationMapEntries = translationsForPackage.map( ( translations, index ) => [ languages[ index ], translations ] );

		return new Map( translationMapEntries );
	} );
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
		return JSON.parse( data ).content;
	} );
}

// Fixes weird gettextParser output.
function getCorrectTranslationFormat( translations ) {
	const result = {};

	Object.keys( translations )
		.filter( key => !!key )
		.map( ( key ) => translations[key] )
		.map( ( obj ) => obj[ Object.keys( obj )[0] ] )
		.forEach( ( obj ) => result[ obj.msgid ] = obj.msgstr[0] );

	return result;
}

function saveTranslations( packageName, translations ) {
	for ( const [ lang, translationDictionary ] of translations ) {
		const pathToSave = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', lang + '.json' );

		fs.outputFileSync( pathToSave, JSON.stringify( translationDictionary, null, 4 ) );
		logger.info( `Saved ${ lang }.json for ${ packageName }` );
	}
}
