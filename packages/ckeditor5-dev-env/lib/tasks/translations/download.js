/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexService = require( './transifex-service' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

/**
 * Downloads translations from the Transifex for each package and language.
 *
 * @param {Object} loginConfig
 * @param {String} loginConfig.username Username for the Transifex account.
 * @param {String} loginConfig.password Password for the Transifex account.
 */
module.exports = function download( loginConfig ) {
	return Promise.resolve()
		.then( () => getPackageNames( loginConfig ) )
		.then( ( packageNames ) => downlaodAndSaveTranslations( loginConfig, packageNames ) )
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

function downlaodAndSaveTranslations( loginConfig, packageNames ) {
	return Promise.all(
		packageNames.map( ( packageName ) => {
			const translationPromises = downloadPoFilesForPackage( loginConfig, packageName );

			return translationPromises.then( translations => {
				saveTranslations( packageName, translations );
			} );
		} )
	);
}

// @returns {Promise<Map>}
function downloadPoFilesForPackage( loginConfig, packageName ) {
	const resourceDetailsPromise = transifexService.getResourceDetails( Object.assign( {}, loginConfig, { slug: packageName } ) );
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
	for ( const [ lang, poFileContent ] of translations ) {
		const pathToSave = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		logger.info( `Saved ${ lang }.po for ${ packageName } package` );
	}
}
