/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexService = require( './transifex-service' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { cleanPoFileContent, createDictionaryFromPoFileContent } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;
const languageCodeMap = require( './languagecodemap.json' );

/**
 * Downloads translations from the Transifex for each CF localizable package.
 * It creates PO files out of the translations and replaces old translations with the downloaded ones.
 *
 * @param {Object} config
 * @param {String} config.token Token to the Transifex API.
 * @param {Map.<String,String>} config.packages A resource name -> package path map for which translations should be downloaded.
 */
module.exports = async function downloadTranslations( config ) {
	const localizablePackageNames = await getLocalizablePackages( config );

	for ( const packageName of localizablePackageNames ) {
		const translations = await downloadPoFiles( config, packageName );

		removeOldTranslation( config.packages.get( packageName ) );
		saveNewTranslations( packageName, config.packages.get( packageName ), translations );
	}

	logger.info( 'Saved all translations.' );
};

/**
 * @param {Object} config
 * @param {String} config.token Token to the Transifex API.
 */
async function getLocalizablePackages( config ) {
	const packageNames = new Set( config.packages.keys() );
	const resources = await transifexService.getResources( config );

	return resources.map( resource => resource.slug )
		.filter( packageName => packageNames.has( packageName ) );
}

/**
 * @param {String} packagePath Package path.
 */
function removeOldTranslation( packagePath ) {
	fs.removeSync( getPathToTranslations( packagePath ) );
}

/**
 * Downloads translations for the given package and returns a languageCode -> translations map.
 *
 * @param {Object} config Configuration.
 * @param {String} config.token Token to the Transifex API.
 * @param {String} packageName Package name.
 * @returns {Promise<Map.<String, Object>>}
 */
async function downloadPoFiles( config, packageName ) {
	const packageOptions = Object.assign( {}, config, { slug: packageName } );
	const resourceDetails = await transifexService.getResourceDetails( packageOptions );

	const languageCodes = resourceDetails.available_languages.map( languageInfo => languageInfo.code );
	const translations = await Promise.all( languageCodes.map( lang => downloadPoFile( config, lang, packageName ) ) );

	return new Map( translations.map( ( languageTranslations, index ) => [
		languageCodes[ index ],
		languageTranslations
	] ) );
}

async function downloadPoFile( config, lang, packageName ) {
	const packageOptions = Object.assign( {}, config, {
		lang,
		slug: packageName
	} );

	const data = await transifexService.getTranslation( packageOptions );

	return data.content;
}

function saveNewTranslations( packageName, packagePath, translations ) {
	let savedFiles = 0;

	for ( let [ lang, poFileContent ] of translations ) {
		if ( !isPoFileContainingTranslations( poFileContent ) ) {
			continue;
		}

		if ( lang in languageCodeMap ) {
			lang = languageCodeMap[ lang ];
		}

		poFileContent = cleanPoFileContent( poFileContent );

		const pathToSave = path.join( getPathToTranslations( packagePath ), lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		savedFiles++;
	}

	logger.info( `Saved ${ savedFiles } PO files for ${ packageName } package.` );
}

function getPathToTranslations( packagePath ) {
	return path.join( process.cwd(), packagePath, 'lang', 'translations' );
}

function isPoFileContainingTranslations( poFileContent ) {
	const translations = createDictionaryFromPoFileContent( poFileContent );

	return Object.keys( translations )
		.some( msgId => translations[ msgId ] !== '' );
}
