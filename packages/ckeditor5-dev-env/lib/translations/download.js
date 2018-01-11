/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexService = require( './transifex-service' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { cleanPoFileContent, createDictionaryFromPoFileContent } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

/**
 * Downloads translations from the Transifex for each package and language.
 *
 * @param {Object} loginConfig
 * @param {String} loginConfig.token Token to the Transifex API.
 */
module.exports = function download( loginConfig ) {
	return Promise.resolve()
		.then( () => getPackageNames( loginConfig ) )
		.then( packageNames => downloadAndReplaceTranslations( loginConfig, packageNames ) )
		.then( () => {
			logger.info( 'Saved all translations.' );
		} )
		.catch( err => {
			logger.error( err );
			throw err;
		} );
};

function getPackageNames( loginConfig ) {
	return transifexService.getResources( loginConfig )
		.then( resources => resources.map( resource => resource.slug ) );
}

function downloadAndReplaceTranslations( loginConfig, packageNames ) {
	let promise = Promise.resolve();

	for ( const packageName of packageNames ) {
		promise = promise.then( () => downloadAndReplaceTranslationsForPackage( loginConfig, packageName ) );
	}

	return promise;
}

function downloadAndReplaceTranslationsForPackage( loginConfig, packageName ) {
	let translations;

	return downloadPoFilesForPackage( loginConfig, packageName )
		.then( _translations => { translations = _translations; } )
		.then( () => removeOldTranslationForPackage( packageName ) )
		.then( () => { saveTranslations( packageName, translations ); } );
}

function removeOldTranslationForPackage( packageName ) {
	const del = require( 'del' );
	const glob = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', '**' );

	return del( glob );
}

function downloadPoFilesForPackage( loginConfig, packageName ) {
	const resourceDetailsPromise = transifexService.getResourceDetails( Object.assign( {}, loginConfig, {
		slug: packageName
	} ) );
	let languageCodes;

	const translationsForPackagePromise = resourceDetailsPromise.then( resourceDetails => {
		languageCodes = resourceDetails.available_languages.map( languageInfo => languageInfo.code );

		return Promise.all(
			languageCodes.map( lang => downloadPoFile( loginConfig, lang, packageName ) )
		);
	} );

	return translationsForPackagePromise.then( translationsForPackage => {
		const translationMapEntries = translationsForPackage
			.map( ( translations, index ) => [ languageCodes[ index ], translations ] );

		return new Map( translationMapEntries );
	} );
}

function downloadPoFile( loginConfig, lang, packageName ) {
	const config = Object.assign( {}, loginConfig, {
		lang,
		slug: packageName
	} );

	return transifexService.getTranslation( config )
		.then( data => data.content );
}

function saveTranslations( packageName, translations ) {
	const languageCodeMap = require( './languagecodemap.json' );
	let savedTranslations = 0;

	for ( let [ lang, poFileContent ] of translations ) {
		if ( !isPoFileContainingTranslations( poFileContent ) ) {
			continue;
		}

		if ( lang in languageCodeMap ) {
			lang = languageCodeMap[ lang ];
		}

		poFileContent = cleanPoFileContent( poFileContent );

		const pathToSave = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		savedTranslations++;
	}

	logger.info( `Saved ${ savedTranslations } PO files for ${ packageName } package.` );
}

function isPoFileContainingTranslations( poFileContent ) {
	const translations = createDictionaryFromPoFileContent( poFileContent );

	return Object.keys( translations ).some( key => translations[ key ] !== '' );
}
