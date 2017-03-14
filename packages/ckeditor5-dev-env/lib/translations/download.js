/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexService = require( './transifex-service' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const translationUtils = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

/**
 * Downloads translations from the Transifex for each package and language.
 *
 * @param {Object} loginConfig
 * @param {String} loginConfig.token Token to the Transifex API.
 */
module.exports = function download( loginConfig ) {
	return Promise.resolve()
		.then( () => getPackageNames( loginConfig ) )
		.then( packageNames => downlaodAndReplaceTranslations( loginConfig, packageNames ) )
		.then( () => {
			logger.info( 'Saved all translations.' );
		} )
		.catch( ( err ) => {
			logger.error( err );
		} );
};

function getPackageNames( loginConfig ) {
	return transifexService.getResources( loginConfig )
		.then( resources => resources.map( ( resource ) => resource.slug ) );
}

function downlaodAndReplaceTranslations( loginConfig, packageNames ) {
	return Promise.all(
		packageNames.map( ( packageName ) => {
			const translationPromises = removeOldTranslationForPackage( packageName )
				.then( () => downloadPoFilesForPackage( loginConfig, packageName ) );

			return translationPromises.then( translations => {
				saveTranslations( packageName, translations );
			} );
		} )
	);
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

	const translationsForPackagePromise = resourceDetailsPromise.then( ( resourceDetails ) => {
		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		languageCodes = resourceDetails.available_languages.map( languageInfo => languageInfo.code );
		// jscs:enable requireCamelCaseOrUpperCaseIdentifiers

		return Promise.all(
			languageCodes.map( ( lang ) => downloadPoFile( loginConfig, lang, packageName ) )
		);
	} );

	return translationsForPackagePromise.then( translationsForPackage => {
		const translationMapEntries = translationsForPackage.map( ( translations, index ) => [ languageCodes[ index ], translations ] );

		return new Map( translationMapEntries );
	} );
}

function downloadPoFile( loginConfig, lang, packageName ) {
	const config = Object.assign( {}, loginConfig, {
		lang,
		slug: packageName
	} );

	return transifexService.getTranslation( config )
		.then( ( data ) => data.content );
}

function saveTranslations( packageName, translations ) {
	const languageCodeMap = require( './languagecodemap.json' );

	for ( let [ lang, poFileContent ] of translations ) {
		if ( !isPoFileContainingTranslations( poFileContent ) ) {
			continue;
		}

		if ( lang in languageCodeMap ) {
			lang = languageCodeMap[ lang ];
		}

		poFileContent = translationUtils.cleanPoFileContent( poFileContent );

		const pathToSave = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		logger.info( `Saved ${ lang }.po for ${ packageName } package.` );
	}
}

function isPoFileContainingTranslations( poFileContent ) {
	const translations = translationUtils.createDicitionaryFromPoFileContent( poFileContent );

	return Object.keys( translations ).some( key => translations[ key ] !== '' );
}
