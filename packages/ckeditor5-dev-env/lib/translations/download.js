/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const fs = require( 'fs-extra' );
const path = require( 'path' );
const transifexService = require( './transifex-service-for-api-v3.0' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { cleanPoFileContent, createDictionaryFromPoFileContent } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;
const languageCodeMap = require( './languagecodemap.json' );
const { verifyProperties } = require( './utils' );

/**
 * Downloads translations from the Transifex for each localizable package.
 * It creates PO files out of the translations and replaces old translations with the downloaded ones.
 *
 * @param {Object} config
 * @param {String} config.token Token to the Transifex API.
 * @param {Map.<String,String>} config.packages A resource name -> package path map for which translations should be downloaded.
 * @param {String} config.cwd Current work directory.
 * @param {Boolean} [config.simplifyLicenseHeader=false] Whether to skip adding the contribute guide URL in the output `*.po` files.
 */
module.exports = async function downloadTranslations( config ) {
	verifyProperties( config, [ 'token', 'packages', 'cwd' ] );

	transifexService.init( config.token );

	logger.info( 'Fetching project information...' );

	const localizablePackageNames = [ ...config.packages.keys() ];
	const { resources, languages } = await transifexService.getProjectData( localizablePackageNames );

	logger.info( 'Downloading translations...' );

	for ( const resource of resources ) {
		const packageName = transifexService.getResourceName( resource );
		const packagePath = getPathToTranslations( config.cwd, config.packages.get( packageName ) );
		const translations = await transifexService.getTranslations( resource, languages );

		removeOldTranslations( packagePath );

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
 * Removes all files from the provided directory.
 *
 * @param {String} packagePath Package path.
 */
function removeOldTranslations( packagePath ) {
	fs.removeSync( packagePath );
}

/**
 * Saves all valid translations on the filesystem. For each translation entry:
 *
 * (1) Check if the content is a translation. Skip processing current entry if it cannot be converted to a PO file.
 * (2) Check if the language code should be mapped to another string on the filesystem.
 * (3) Prepare the translation for storing on the filesystem: remove personal data and add a banner with information how to contribute.
 *
 * @param {Object} config
 * @param {String} config.packageName Package name.
 * @param {String} config.packagePath Package path.
 * @param {Map.<String,String>} config.translations The translation map: language code -> translation content.
 * @param {Boolean} config.simplifyLicenseHeader Whether to skip adding the contribute guide URL in the output `*.po` files.
 */
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
 * Returns a path to the translation directory for the provided package path.
 *
 * @param {String} cwd Current working directory.
 * @param {String} packagePath Package path.
 * @return {String}
 */
function getPathToTranslations( cwd, packagePath ) {
	return path.join( cwd, packagePath, 'lang', 'translations' );
}

/**
 * Checks if the received data is a translation.
 *
 * @param {String} poFileContent Received data.
 * @returns {Boolean}
 */
function isPoFileContainingTranslations( poFileContent ) {
	const translations = createDictionaryFromPoFileContent( poFileContent );

	return Object.keys( translations )
		.some( msgId => translations[ msgId ] !== '' );
}
