/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { transifexApi } = require( '@transifex/api' );
const fetch = require( 'node-fetch' );

const MAX_DOWNLOAD_ATTEMPTS = 10;
const TIMEOUT_BEFORE_NEW_DOWNLOAD_ATTEMPT = 3000; // In milliseconds.

// It may happen that sending several dozen requests at the same time fails due to the limitations in the operating system on the network
// stack. Therefore, each request is delayed by the number of milliseconds defined below.
const TIMEOUT_BEFORE_NEW_REQUEST = 100;

/**
 * Promise wrappers of the Transifex API v3.0.
 *
 * @see https://docs.transifex.com/api-3-0/introduction-to-api-3-0 for API documentation.
 */
module.exports = {
	init,
	getProjectData,
	getTranslations,
	getResourceName,
	getLanguageCode
};

/**
 * Configures the API token for Transifex service if it has not been set yet.
 *
 * @param {String} token Token for the Transifex API.
 */
function init( token ) {
	if ( !transifexApi.auth ) {
		transifexApi.setup( { auth: token } );
	}
}

/**
 * Retrieves all the package names and languages associated with the CKEditor 5 project from the Transifex service.
 *
 * @param {String} organizationName Name of the organization to which the project belongs.
 * @param {String} projectName Name of the project for downloading the translations.
 * @param {Array.<String>} localizablePackageNames Names of all packages for which translations should be downloaded.
 * @returns {Promise.<Object>} result
 * @returns {Array.<Object>} result.resources All found resource instances for which translations could be downloaded.
 * @returns {Array.<Object>} result.languages All found language instances in the project.
 */
async function getProjectData( organizationName, projectName, localizablePackageNames ) {
	const organization = await transifexApi.Organization.get( { slug: organizationName } );
	const projects = await organization.fetch( 'projects' );
	const project = await projects.get( { slug: projectName } );
	const resources = await project.fetch( 'resources' );
	const languages = await project.fetch( 'languages' );

	const resourcesArray = [];
	const languagesArray = [];

	for await ( const resource of resources.all() ) {
		const resourceName = getResourceName( resource );

		if ( localizablePackageNames.includes( resourceName ) ) {
			resourcesArray.push( resource );
		}
	}

	for await ( const language of languages.all() ) {
		languagesArray.push( language );
	}

	return {
		resources: resourcesArray,
		languages: languagesArray
	};
}

/**
 * Fetches all the translations and the language source file in the PO format for the given package. The download procedure consists of the
 * following steps:
 *
 * (1) Create the download requests for the language source file and all the translations. This download request triggers the Transifex
 * service to start preparing the PO file.
 * (2) Retrieve the target URL from every download request, where the status of the file being prepared for download can be checked.
 * (3) Download the file from the target URL.
 *
 * @param {Object} resource The resource instance for which translations should be downloaded.
 * @param {Array.<Object>} languages An array of all the language instances found in the project.
 * @returns {Promise.<Map.<String,String>>} The translation map: language code -> translation content.
 */
async function getTranslations( resource, languages ) {
	const downloadRequests = await Promise
		.all( [
			createDownloadRequest( resource ),
			...languages.map( async ( language, index ) => {
				await wait( TIMEOUT_BEFORE_NEW_REQUEST * index );

				return createDownloadRequest( resource, language );
			} )
		] )
		.then( requests => requests.map( request => {
			const url = request.links.self;
			const { resource, language } = request.related;

			return {
				url,
				resourceName: getResourceName( resource ),
				languageCode: language ? getLanguageCode( language ) : 'en'
			};
		} ) );

	const translations = await Promise.all(
		downloadRequests.map( async ( downloadRequest, index ) => {
			await wait( TIMEOUT_BEFORE_NEW_REQUEST * index );

			return downloadFile( downloadRequest );
		} )
	);

	return new Map( translations );
}

/**
 * Creates the download request for the given resource and the language. If the language has not been provided, it means that the request
 * concerns the source language (English). This distinction is needed, because Transifex service has two dedicated resources: one for the
 * translations and another one for the source strings.
 *
 * @param {Object} resource The resource instance for which translation should be downloaded.
 * @param {Object} [language] The language instance for which translation should be downloaded.
 * @returns {Promise.<Object>}
 */
function createDownloadRequest( resource, language ) {
	const attributes = {
		callback_url: null,
		content_encoding: 'text',
		file_type: 'default',
		pseudo: false
	};

	const relationships = language ? { resource, language } : { resource };
	const requestName = language ? 'ResourceTranslationAsyncDownload' : 'ResourceStringAsyncDownload';
	const requestType = language ? 'resource_translations_async_downloads' : 'resource_strings_async_downloads';

	return transifexApi[ requestName ].create( {
		attributes,
		relationships,
		type: requestType
	} );
}

/**
 * Tries to fetch the file, up to the MAX_DOWNLOAD_ATTEMPTS times, with the TIMEOUT_BEFORE_NEW_DOWNLOAD_ATTEMPT milliseconds timeout between
 * each attempt. There are three possible cases that are handled during downloading a file:
 *
 * (1) According to the Transifex API v3.0, when the requested file is ready for download, the Transifex service returns HTTP code 303,
 * which is the redirection to the new location, where the file is available. By default, `node-fetch` follows redirections so the requested
 * file is downloaded automatically.
 * (2) If the requested file is not ready yet, but the response status from the Transifex service was successful and the number of retries
 * has not reached the limit yet, the request is queued and retried after the TIMEOUT_BEFORE_NEW_DOWNLOAD_ATTEMPT timeout.
 * (3) Otherwise, there is either a problem with downloading a file (the request has failed) or the number of retries has reached the limit,
 * so an error is thrown.
 *
 * @param {Object} downloadRequest Data that defines the requested file.
 * @param {String} downloadRequest.url URL where generated PO file will be available to download.
 * @param {String} downloadRequest.resourceName Package name for which the URL is generated.
 * @param {String} downloadRequest.languageCode Language code for which the URL is generated.
 * @returns {Promise.<Array.<String>>} The 2-element array: the language code at index 0 and the translation content at index 1.
 */
async function downloadFile( downloadRequest, downloadAttempt = 1 ) {
	const { url, resourceName, languageCode } = downloadRequest;

	const response = await fetch( url, {
		headers: {
			...transifexApi.auth()
		}
	} );

	if ( response.ok && response.redirected ) {
		const translation = await response.text();

		return [ languageCode, translation ];
	}

	if ( !response.ok || downloadAttempt === MAX_DOWNLOAD_ATTEMPTS ) {
		let errorMessage = `\nFailed to download the PO file for the "${ languageCode }" language for the "${ resourceName }" package.`;

		if ( !response.ok ) {
			errorMessage += `\nReceived response: ${ response.status } ${ response.statusText }`;
			errorMessage += `\nRequested URL: ${ url }`;
		} else {
			errorMessage += '\nRequested file is not ready yet, but the limit of file download attempts has been reached.';
		}

		throw new Error( errorMessage );
	}

	await wait( TIMEOUT_BEFORE_NEW_DOWNLOAD_ATTEMPT );

	return downloadFile( downloadRequest, downloadAttempt + 1 );
}

/**
 * Retrieves the resource name (the package name) from the resource instance.
 *
 * @param {Object} resource Resource instance.
 * @returns {String}
 */
function getResourceName( resource ) {
	return resource.attributes.slug;
}

/**
 * Retrieves the language code from the language instance.
 *
 * @param {Object} language language instance.
 * @returns {String}
 */
function getLanguageCode( language ) {
	return language.attributes.code;
}

/**
 * Simple promisified timeout that resolves after defined number of milliseconds.
 *
 * @param {Number} numberOfMilliseconds Number of milliseconds after which the promise will be resolved.
 * @returns {Promise}
 */
function wait( numberOfMilliseconds ) {
	return new Promise( resolve => setTimeout( resolve, numberOfMilliseconds ) );
}
