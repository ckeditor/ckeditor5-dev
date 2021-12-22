/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

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

	transifexService.init( { token: config.token } );

	logger.info( 'Fetching project information...' );

	const localizablePackageNames = [ ...config.packages.keys() ];
	const { resources, languages } = await transifexService.getProjectData( { localizablePackageNames } );

	logger.info( 'Downloading translations...' );

	for ( const resource of resources ) {
		const packageName = transifexService.getResourceName( resource );
		const packagePath = getPathToTranslations( config.cwd, config.packages.get( packageName ) );
		const translations = await transifexService.getTranslations( { resource, languages } );

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
 * @param {String} packagePath Package path.
 */
function removeOldTranslations( packagePath ) {
	fs.removeSync( packagePath );
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
