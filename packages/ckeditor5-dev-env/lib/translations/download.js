/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexService = require( './transifex-service' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { cleanPoFileContent, createDictionaryFromPoFileContent } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;
const languageCodeMap = require( './languagecodemap.json' );
const { verifyProperties } = require( './utils' );

/**
 * Downloads translations from the Transifex for each CF localizable package.
 * It creates PO files out of the translations and replaces old translations with the downloaded ones.
 *
 * @param {Object} config
 * @param {String} config.token Token to the Transifex API.
 * @param {Map.<String,String>} config.packages A resource name -> package path map for which translations should be downloaded.
 * @param {String} config.cwd Current work directory.
 * @param {String} config.url Transifex API URL where the request should be send.
 * @param {Boolean} [config.simplifyLicenseHeader=false] Whether to skip adding the contribute guide URL in the output `*.po` files.
 */
module.exports = async function downloadTranslations( config ) {
	verifyProperties( config, [ 'token', 'url', 'packages', 'cwd' ] );

	const localizablePackageNames = await getLocalizablePackages( config );

	for ( const packageName of localizablePackageNames ) {
		const translations = await downloadPoFiles( config, packageName );
		const packagePath = getPathToTranslations( config.cwd, config.packages.get( packageName ) );

		removeOldTranslation( packagePath );
		saveNewTranslations( {
			packageName,
			packagePath,
			translations,
			simplifyLicenseHeader: config.simplifyLicenseHeader
		} );
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
	fs.removeSync( packagePath );
}

/**
 * Downloads translations for the given package and returns a languageCode -> translations map.
 *
 * @param {Object} config Configuration.
 * @param {String} config.token Token to the Transifex API.
 * @param {String} packageName Package name.
 * @param {String} config.cwd Current work directory.
 * @param {String} config.url Transifex API URL where the request should be send.
 * @returns {Promise<Map.<String, Object>>}
 */
async function downloadPoFiles( config, packageName ) {
	const requestConfig = {
		url: config.url,
		token: config.token,
		slug: packageName
	};

	const resourceDetails = await transifexService.getResourceDetails( requestConfig );

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

function saveNewTranslations( { packageName, packagePath, translations, simplifyLicenseHeader } ) {
	let savedFiles = 0;

	for ( let [ lang, poFileContent ] of translations ) {
		if ( !isPoFileContainingTranslations( poFileContent ) ) {
			continue;
		}

		if ( lang in languageCodeMap ) {
			lang = languageCodeMap[ lang ];
		}

		poFileContent = cleanPoFileContent( poFileContent, { simplifyLicenseHeader } );

		const pathToSave = path.join( packagePath, lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		savedFiles++;
	}

	logger.info( `Saved ${ savedFiles } PO files for ${ packageName } package.` );
}

/**
 * @param {String} cwd Current work directory.
 * @param {String} packagePath Package path.
 * @return {String}
 */
function getPathToTranslations( cwd, packagePath ) {
	return path.join( cwd, packagePath, 'lang', 'translations' );
}

function isPoFileContainingTranslations( poFileContent ) {
	const translations = createDictionaryFromPoFileContent( poFileContent );

	return Object.keys( translations )
		.some( msgId => translations[ msgId ] !== '' );
}
