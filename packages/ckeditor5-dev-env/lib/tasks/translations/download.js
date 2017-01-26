/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexAPI = require( './transifex-api' );
const collectUtils = require( './collect-utils' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

/**
 * Downloads translations from the Transifex for each package and language.
 *
 * @param {Object} loginConfig
 * @param {String} loginConfig.username Username for the Transifex account.
 * @param {String} loginConfig.password Password for the Transifex account.
 */
module.exports = function download( loginConfig ) {
	const packageNames = collectUtils.getPackagesContainingContexts();

	const downlaodAndSaveTranslations = packageNames.map( ( packageName ) => {
		const translationPromises = downloadPoFilesForPackage( loginConfig, packageName );

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

// @returns {Promise<Map>}
function downloadPoFilesForPackage( loginConfig, packageName ) {
	const resourceDetailsPromise = transifexAPI.getResourceDetails( Object.assign( {}, loginConfig, { slug: packageName } ) );
	let languageCodes;

	const translationsForPackagePromise = resourceDetailsPromise.then( ( resourceDetails ) => {
		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		languageCodes = resourceDetails.available_languages.map( languageInfo => languageInfo.code );
		// jscs:enable requireCamelCaseOrUpperCaseIdentifiers

		return Promise.all(
			languageCodes.map( ( lang ) => {
				const transifexDownloadConfig = Object.assign( {}, loginConfig, {
					lang,
					slug: packageName
				} );

				return downloadPoFile( transifexDownloadConfig );
			} )
		);
	} );

	return translationsForPackagePromise.then( translationsForPackage => {
		const translationMapEntries = translationsForPackage.map( ( translations, index ) => [ languageCodes[ index ], translations ] );

		return new Map( translationMapEntries );
	} );
}

function downloadPoFile( config ) {
	return transifexAPI.getTranslation( config ).then( ( data ) => data.content );
}

function saveTranslations( packageName, translations ) {
	for ( const [ lang, poFileContent ] of translations ) {
		const pathToSave = path.join( process.cwd(), 'packages', packageName, 'lang', 'translations', lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		logger.info( `Saved ${ lang }.po for ${ packageName } package` );
	}
}
