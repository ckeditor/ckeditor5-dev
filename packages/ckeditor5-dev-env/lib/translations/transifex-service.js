/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const request = require( 'request' );
// In case of debugging requests install and enable following package
// and remove `createJsonResponseHandler` callback from the request arguments.
// See https://github.com/request/request-debug.
// require( 'request-debug' )( request );

const { retryAsyncFunction } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

/**
 * Promise wrappers of the Transifex API.
 *
 * @see https://docs.transifex.com/api/ for API documentation.
 */
module.exports = {
	/**
	 * Downloads available resources.
	 *
	 * @param {Object} config
	 * @param {String} config.token Token to the Transifex API.
	 * @param {String} config.url Transifex API URL where the request should be send.
	 * @returns {Promise.<Object>}
	 */
	getResources( { token, url } ) {
		return retryAsyncFunction( () => {
			return new Promise( ( resolve, reject ) => {
				request.get( `${ url }/resources/`, {
					auth: { username: 'api', password: token }
				}, createJsonResponseHandler( resolve, reject, 'getResources' ) );
			} );
		} );
	},

	/**
	 * Uploads resource for the first time.
	 *
	 * @param {Object} config
	 * @param {String} config.token Token to the Transifex API.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.content Resource content.
	 * @param {String} config.name Resource name.
	 * @param {String} config.url Transifex API URL where the request should be send.
	 * @returns {Promise.<Object>}
	 */
	postResource( { token, name, slug, content, url } ) {
		return retryAsyncFunction( () => {
			return new Promise( ( resolve, reject ) => {
				request.post( `${ url }/resources/`, {
					auth: { username: 'api', password: token },
					formData: { slug, name, content, 'i18n_type': 'PO' }
				}, createJsonResponseHandler( resolve, reject, 'postResource' ) );
			} );
		} );
	},

	/**
	 * Updates resource content.
	 *
	 * @param {Object} config
	 * @param {String} config.token Token to the Transifex API.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.content Resource content.
	 * @param {String} config.url Transifex API URL where the request should be send.
	 * @returns {Promise.<Object>}
	 */
	putResourceContent( { token, slug, content, url } ) {
		return retryAsyncFunction( () => {
			return new Promise( ( resolve, reject ) => {
				request.put( `${ url }/resource/${ slug }/content/`, {
					auth: { username: 'api', password: token },
					formData: { content, 'i18n_type': 'PO' }
				}, createJsonResponseHandler( resolve, reject, 'putResourceContent' ) );
			} );
		} );
	},

	/**
	 * Returns resource details promise.
	 *
	 * @param {Object} config
	 * @param {String} config.token Token to the Transifex API.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.url Transifex API URL where the request should be send.
	 * @returns {Promise.<Object>}
	 */
	getResourceDetails( { token, slug, url } ) {
		return retryAsyncFunction( () => {
			return new Promise( ( resolve, reject ) => {
				request.get( `${ url }/resource/${ slug }/?details`, {
					auth: { username: 'api', password: token }
				}, createJsonResponseHandler( resolve, reject, 'getResourceDetails' ) );
			} );
		} );
	},

	/**
	 * Returns translations promise for the target resource and language.
	 *
	 * @param {Object} config
	 * @param {String} config.token Token to the Transifex API.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.lang Target language.
	 * @param {String} config.url Transifex API URL where the request should be send.
	 * @returns {Promise.<Object>}
	 */
	getTranslation( { token, slug, lang, url } ) {
		return retryAsyncFunction( () => {
			return new Promise( ( resolve, reject ) => {
				request.get( `${ url }/resource/${ slug }/translation/${ lang }/`, {
					auth: { username: 'api', password: token }
				}, createJsonResponseHandler( resolve, reject, 'getTranslation' ) );
			} );
		} );
	}
};

// Creates handler for the requests in the promise wrappers.
function createJsonResponseHandler( resolve, reject, methodName ) {
	return function handleJsonResponse( error, response, body ) {
		if ( error ) {
			return reject( error );
		} else if ( response.statusCode >= 300 ) {
			return reject( new Error( `Status code: ${ response.statusCode } for '${ methodName }' method.` ) );
		}

		try {
			resolve( JSON.parse( body ) );
		} catch ( err ) {
			reject(
				new Error( `Error handled while parsing body of the '${ methodName }' response: ${ body.toString() }` )
			);
		}
	};
}
