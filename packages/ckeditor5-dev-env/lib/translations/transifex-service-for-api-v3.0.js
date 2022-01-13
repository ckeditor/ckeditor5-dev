/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { transifexApi } = require( '@transifex/api' );
const fetch = require( 'node-fetch' );

const MAX_DOWNLOAD_ATTEMPTS = 10;
const REQUEST_RETRY_TIMEOUT = 3000; // In milliseconds.

// It may happen that sending several dozen requests at the same time fails due to the limitations in the operating system on the network
// stack. Therefore, each request is delayed by the number of milliseconds defined below.
const REQUEST_START_OFFSET_TIMEOUT = 100;

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
 * Retrieves all the resources and languages associated with the requested project within given organization from the Transifex service.
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
	const languagesArray = [ createSourceLanguage() ];

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
 * Fetches all the translations and the language source file in the PO format for the given resource. The download procedure consists of the
 * following steps:
 *
 * (1) Create the download requests for the language source file and all the translations. This download request triggers the Transifex
 * service to start preparing the PO file.
 * (2) Retrieve the target URL from every download request, where the status of the file being prepared for download can be checked.
 * (3) Download the file from the target URL received in step (2).
 *
 * The download procedure is not interrupted when any request has failed for any reason, but continues until the end for each language.
 * Failed requests and all fetched translations are collected and returned to the caller for further processing.
 *
 * @param {Object} resource The resource instance for which translations should be downloaded.
 * @param {Array.<Object>} languages An array of all the language instances found in the project.
 * @returns {Promise.<Object>} result
 * @returns {Map.<String,String>} result.translations The translation map: language code -> translation content.
 * @returns {Array.<Object>} result.failedDownloads Collection of all the failed downloads.
 */
async function getTranslations( resource, languages ) {
	const downloadRequests = await Promise
		.allSettled(
			languages.map( async ( language, index ) => {
				await wait( REQUEST_START_OFFSET_TIMEOUT * index );

				return createDownloadRequest( resource, language );
			} ) )
		.then( results => ( {
			failed: getFailedResults( results ),
			successful: getSuccessfulResults( results ).map( result => {
				const url = result.links.self;
				const { resource, language = createSourceLanguage() } = result.related;

				return {
					url,
					resourceName: getResourceName( resource ),
					languageCode: getLanguageCode( language )
				};
			} )
		} ) );

	const translationRequests = await Promise
		.allSettled(
			downloadRequests.successful.map( async ( request, index ) => {
				await wait( REQUEST_START_OFFSET_TIMEOUT * index );

				return downloadFile( request );
			} )
		)
		.then( results => ( {
			failed: getFailedResults( results ),
			successful: getSuccessfulResults( results )
		} ) );

	return {
		translations: new Map( translationRequests.successful ),
		failedDownloads: [
			...downloadRequests.failed,
			...translationRequests.failed
		]
	};
}

/**
 * Creates the download request for the given resource and the language.
 *
 * @param {Object} resource The resource instance for which translation should be downloaded.
 * @param {Object} language The language instance for which translation should be downloaded.
 * @param {Number} [numberOfAttempts=1] Current number of request attempt.
 * @returns {Promise.<Object>}
 */
function createDownloadRequest( resource, language, numberOfAttempts = 1 ) {
	const attributes = {
		callback_url: null,
		content_encoding: 'text',
		file_type: 'default',
		pseudo: false
	};

	const relationships = isSourceLanguage( language ) ? { resource } : { resource, language };
	const requestName = isSourceLanguage( language ) ? 'ResourceStringAsyncDownload' : 'ResourceTranslationAsyncDownload';
	const requestType = isSourceLanguage( language ) ? 'resource_strings_async_downloads' : 'resource_translations_async_downloads';

	return transifexApi[ requestName ]
		.create( {
			attributes,
			relationships,
			type: requestType
		} )
		.catch( async () => {
			if ( numberOfAttempts === MAX_DOWNLOAD_ATTEMPTS ) {
				const resourceName = getResourceName( resource );
				const languageCode = getLanguageCode( language );

				return Promise.reject( {
					resourceName,
					languageCode,
					errorMessage: 'Failed to create download request.'
				} );
			}

			await wait( REQUEST_RETRY_TIMEOUT );

			return createDownloadRequest( resource, language, numberOfAttempts + 1 );
		} );
}

/**
 * Tries to fetch the file, up to the MAX_DOWNLOAD_ATTEMPTS times, with the REQUEST_RETRY_TIMEOUT milliseconds timeout between each
 * attempt. There are three possible cases that are handled during downloading a file:
 *
 * (1) According to the Transifex API v3.0, when the requested file is ready for download, the Transifex service returns HTTP code 303,
 * which is the redirection to the new location, where the file is available. By default, `node-fetch` follows redirections so the requested
 * file is downloaded automatically.
 * (2) If the requested file is not ready yet, but the response status from the Transifex service was successful and the number of retries
 * has not reached the limit yet, the request is queued and retried after the REQUEST_RETRY_TIMEOUT timeout.
 * (3) Otherwise, there is either a problem with downloading a file (the request has failed) or the number of retries has reached the limit,
 * so rejected promise is returned.
 *
 * @param {Object} downloadRequest Data that defines the requested file.
 * @param {String} downloadRequest.url URL where generated PO file will be available to download.
 * @param {String} downloadRequest.resourceName Package name for which the URL is generated.
 * @param {String} downloadRequest.languageCode Language code for which the URL is generated.
 * @param {Number} [numberOfAttempts=1] Current number of download attempt.
 * @returns {Promise.<Array.<String>>} The 2-element array: the language code at index 0 and the translation content at index 1.
 */
async function downloadFile( downloadRequest, numberOfAttempts = 1 ) {
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

	if ( !response.ok || numberOfAttempts === MAX_DOWNLOAD_ATTEMPTS ) {
		let errorMessage = 'Failed to download the translation file. ';

		if ( !response.ok ) {
			errorMessage += `Received response: ${ response.status } ${ response.statusText }`;
		} else {
			errorMessage += 'Requested file is not ready yet, but the limit of file download attempts has been reached.';
		}

		return Promise.reject( {
			resourceName,
			languageCode,
			errorMessage
		} );
	}

	await wait( REQUEST_RETRY_TIMEOUT );

	return downloadFile( downloadRequest, numberOfAttempts + 1 );
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
 * @param {Object} language Language instance.
 * @returns {String}
 */
function getLanguageCode( language ) {
	return language.attributes.code;
}

/**
 * Creates an artificial Transifex language instance for the source language, which is English. The language instance for the source strings
 * is needed, because Transifex service has two dedicated API resources: one for the translations and another one for the source strings.
 *
 * @returns {Object}
 */
function createSourceLanguage() {
	return {
		attributes: {
			code: 'en'
		}
	};
}

/**
 * Checks if the language instance is the source language, which is English.
 *
 * @param {Object} language Language instance.
 * @returns {Boolean}
 */
function isSourceLanguage( language ) {
	return getLanguageCode( language ) === 'en';
}

/**
 * Returns results from each rejected promise, which are returned from the `Promise.allSettled()` method.
 *
 * @param {Array.<Object>} results Collection of objects that each describes the outcome of each promise.
 * @returns {Array.<*>}
 */
function getFailedResults( results ) {
	return results
		.filter( result => result.status === 'rejected' )
		.map( result => result.reason );
}

/**
 * Returns results from each fulfilled promise, which are returned from the `Promise.allSettled()` method.
 *
 * @param {Array.<Object>} results Collection of objects that each describes the outcome of each promise.
 * @returns {Array.<*>}
 */
function getSuccessfulResults( results ) {
	return results
		.filter( result => result.status === 'fulfilled' )
		.map( result => result.value );
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
