/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs-extra' );
const chalk = require( 'chalk' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const { cleanPoFileContent, createDictionaryFromPoFileContent } = require( '@ckeditor/ckeditor5-dev-translations' );
const transifexService = require( './transifexservice' );
const { verifyProperties, createLogger } = require( './utils' );
const languageCodeMap = require( './languagecodemap.json' );

const logger = createLogger();

/**
 * Downloads translations from the Transifex for each localizable package. It creates `*.po` files out of the translations and replaces old
 * translations with the downloaded ones. If not all translations have been downloaded successfully, the `.transifex-failed-downloads.json`
 * file is created, containing information about the packages and languages for which the translations could not be downloaded. This file is
 * then used next time this script is run: it will try to download translations only for packages and languages that failed previously.
 *
 * @param {Object} config
 * @param {String} config.organizationName Name of the organization to which the project belongs.
 * @param {String} config.projectName Name of the project for downloading the translations.
 * @param {String} config.token Token to the Transifex API.
 * @param {Map.<String,String>} config.packages A resource name -> package path map for which translations should be downloaded.
 * The resource name must be the same as the name used in the Transifex service. The package path could be any local path fragment, where
 * the downloaded translation will be stored. The final path for storing the translations is a combination of the `config.cwd` with the
 * mentioned package path and the `lang/translations` subdirectory.
 * @param {String} config.cwd Current work directory.
 * @param {Boolean} [config.simplifyLicenseHeader=false] Whether to skip adding the contribute guide URL in the output `*.po` files.
 */
module.exports = async function downloadTranslations( config ) {
	verifyProperties( config, [ 'organizationName', 'projectName', 'token', 'packages', 'cwd' ] );

	transifexService.init( config.token );

	logger.progress( 'Fetching project information...' );

	const localizablePackageNames = [ ...config.packages.keys() ];
	const { resources, languages } = await transifexService.getProjectData(
		config.organizationName,
		config.projectName,
		localizablePackageNames
	);

	const failedDownloads = [];
	const { resourcesToProcess, isFailedDownloadFileAvailable } = getResourcesToProcess( { cwd: config.cwd, resources, languages } );

	if ( isFailedDownloadFileAvailable ) {
		logger.warning( 'Found the file containing a list of packages that failed during the last script execution.' );
		logger.warning( 'The script will process only packages listed in the file instead of all passed as "config.packages".' );

		logger.progress( 'Downloading only translations that failed previously...' );
	} else {
		logger.progress( 'Downloading all translations...' );
	}

	for ( const { resource, languages } of resourcesToProcess ) {
		const packageName = transifexService.getResourceName( resource );
		const packagePath = config.packages.get( packageName );
		const pathToTranslations = path.join( config.cwd, packagePath, 'lang', 'translations' );
		const spinner = tools.createSpinner( `Processing "${ packageName }"...`, { indentLevel: 1, emoji: '👉' } );

		spinner.start();

		// Remove all old translations before saving new ones, but only if previously the download procedure has been finished without any
		// failures. Otherwise, the current download procedure only tries to fetch the previously failed translations, so no existing files
		// are removed beforehand.
		if ( !isFailedDownloadFileAvailable ) {
			fs.removeSync( pathToTranslations );
		}

		const { translations, failedDownloads: failedDownloadsForPackage } = await transifexService.getTranslations( resource, languages );

		failedDownloads.push( ...failedDownloadsForPackage );

		const savedFiles = saveNewTranslations( {
			pathToTranslations,
			translations,
			simplifyLicenseHeader: config.simplifyLicenseHeader
		} );

		let statusMessage;

		if ( failedDownloadsForPackage.length ) {
			statusMessage = `Saved ${ savedFiles } "*.po" file(s). ${ failedDownloadsForPackage.length } requests failed.`;
			spinner.finish( { emoji: '❌' } );
		} else {
			statusMessage = `Saved ${ savedFiles } "*.po" file(s).`;
			spinner.finish();
		}

		logger.info( ' '.repeat( 6 ) + chalk.gray( statusMessage ) );
	}

	updateFailedDownloads( { cwd: config.cwd, failedDownloads } );

	if ( failedDownloads.length ) {
		logger.warning( 'Not all translations were downloaded due to errors in Transifex API.' );
		logger.warning( `Review the "${ chalk.underline( getPathToFailedDownloads( config.cwd ) ) }" file for more details.` );
		logger.warning( 'Re-running the script will process only packages specified in the file.' );
	} else {
		logger.progress( 'Saved all translations.' );
	}
};

/**
 * Saves all valid translations on the filesystem. For each translation entry:
 *
 * (1) Check if the content is a translation. Skip processing current entry if it cannot be converted to a PO file.
 * (2) Check if the language code should be mapped to another string on the filesystem.
 * (3) Prepare the translation for storing on the filesystem: remove personal data and add a banner with information how to contribute.
 *
 * @param {Object} config
 * @param {String} config.pathToTranslations Path to translations.
 * @param {Map.<String,String>} config.translations The translation map: language code -> translation content.
 * @param {Boolean} config.simplifyLicenseHeader Whether to skip adding the contribute guide URL in the output `*.po` files.
 * @returns {Number} Number of saved files.
 */
function saveNewTranslations( { pathToTranslations, translations, simplifyLicenseHeader } ) {
	let savedFiles = 0;

	for ( let [ lang, poFileContent ] of translations ) {
		if ( !isPoFileContainingTranslations( poFileContent ) ) {
			continue;
		}

		if ( lang in languageCodeMap ) {
			lang = languageCodeMap[ lang ];
		}

		poFileContent = cleanPoFileContent( poFileContent, { simplifyLicenseHeader } );

		const pathToSave = path.join( pathToTranslations, lang + '.po' );

		fs.outputFileSync( pathToSave, poFileContent );
		savedFiles++;
	}

	return savedFiles;
}

/**
 * Based on whether previous download procedure has been finished without any failures, returns a collection of package names and language
 * codes, for which translations will be downloaded:
 *
 * (1) If previous download procedure ended successfully, all translations for all resources will be downloaded.
 * (2) Otherwise, only packages and their failed translation downloads defined in `.transifex-failed-downloads.json` are taken into account.
 *
 * @param {Object} config
 * @param {String} config.cwd Current work directory.
 * @param {Array.<Object>} config.resources All found resource instances for which translations could be downloaded.
 * @param {Array.<Object>} config.languages All found language instances in the project.
 * @returns {Object} result
 * @returns {Boolean} result.isFailedDownloadFileAvailable Indicates whether previous download procedure did not fetch all translations.
 * @returns {Array.<Object>} result.resourcesToProcess Resource instances and their associated language instances to use during downloading
 * the translations.
 */
function getResourcesToProcess( { cwd, resources, languages } ) {
	const pathToFailedDownloads = getPathToFailedDownloads( cwd );
	const isFailedDownloadFileAvailable = fs.existsSync( pathToFailedDownloads );

	if ( !isFailedDownloadFileAvailable ) {
		return {
			isFailedDownloadFileAvailable,
			resourcesToProcess: resources.map( resource => ( { resource, languages } ) )
		};
	}

	const resourcesMap = new Map( [
		...resources.map( resource => [ transifexService.getResourceName( resource ), resource ] )
	] );

	const languagesMap = new Map( [
		...languages.map( language => [ transifexService.getLanguageCode( language ), language ] )
	] );

	return {
		isFailedDownloadFileAvailable,
		resourcesToProcess: fs.readJsonSync( pathToFailedDownloads )
			.map( item => ( {
				resource: resourcesMap.get( item.resourceName ),
				languages: item.languages
					.filter( language => languagesMap.has( language.code ) )
					.map( language => languagesMap.get( language.code ) )
			} ) )
			.filter( item => item.resource && item.languages.length )
	};
}

/**
 * Saves all the failed downloads to `.transifex-failed-downloads.json` file. If there are no failures, the file is removed.
 *
 * @param {Object} config
 * @param {String} config.cwd Current work directory.
 * @param {Array.<Object>} config.failedDownloads Collection of all the failed downloads.
 */
function updateFailedDownloads( { cwd, failedDownloads } ) {
	const pathToFailedDownloads = getPathToFailedDownloads( cwd );

	if ( failedDownloads.length ) {
		const groupedFailedDownloads = failedDownloads.reduce( ( result, failedDownload ) => {
			const failedPackage = result.get( failedDownload.resourceName ) || {
				resourceName: failedDownload.resourceName,
				languages: []
			};

			failedPackage.languages.push( {
				code: failedDownload.languageCode,
				errorMessage: failedDownload.errorMessage
			} );

			return result.set( failedDownload.resourceName, failedPackage );
		}, new Map() );

		fs.writeJsonSync( pathToFailedDownloads, [ ...groupedFailedDownloads.values() ], { spaces: 2 } );
	} else {
		fs.removeSync( pathToFailedDownloads );
	}
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

/**
 * Returns an absolute path to the file containing failed downloads.
 *
 * @param {String} cwd Current working directory.
 * @returns {String}
 */
function getPathToFailedDownloads( cwd ) {
	return path.join( cwd, '.transifex-failed-downloads.json' );
}
