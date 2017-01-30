/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const request = require( 'request' );

const projectSlug = 'test-779';
const API_BASE = `http://www.transifex.com/api/2/project/${ projectSlug }`;

/**
 * Promise wrappers of the Transifex API.
 *
 * @see https://docs.transifex.com/api/ for API documentation.
 */
module.exports = {
	/**
	 * Returns promise whether or not the resource exists.
	 *
	 * @param {Object} config
	 * @param {String} config.username Username for the Transifex account.
	 * @param {String} config.password Username for the Transifex account.
	 * @param {String} config.slug Resource slug.
	 * @returns {Promise<Boolean>}
	 */
	hasResource( { username, password, slug } ) {
		return new Promise( ( resolve ) => {
			request.get( `${ API_BASE }/resource/${ slug }/`, {
				auth: { username, password },
			}, ( error, response ) => {
				if ( error ) {
					resolve( false );
				} else if ( response.statusCode !== 200 ) {
					resolve( false );
				} else {
					resolve( true );
				}
			} );
		} );
	},

	/**
	 * Uploads resource for the first time.
	 *
	 * @param {Object} config
	 * @param {String} config.username Username for the Transifex account.
	 * @param {String} config.password Username for the Transifex account.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.content Resource content.
	 * @param {String} config.name Resource name.
	 * @returns {Promise<Object>}
	 */
	postResource( { username, password, name, slug, content } ) {
		return new Promise( ( resolve, reject ) => {
			request.post( `${ API_BASE }/resources/`, {
				auth: { username, password },
				formData: { slug, name, content, 'i18n_type': 'PO' }
			}, ( error, response, body ) => {
				if ( error ) {
					reject( error );
				} else {
					resolve( JSON.parse( body ) );
				}
			} );
		} );
	},

	/**
	 * Updates resoure content.
	 *
	 * @param {Object} config
	 * @param {String} config.username Username for the Transifex account.
	 * @param {String} config.password Username for the Transifex account.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.content Resource content.
	 * @returns {Promise<Object>}
	 */
	putResourceContent( { username, password, slug, content } ) {
		return new Promise( ( resolve, reject ) => {
			request.put( `${ API_BASE }/resource/${ slug }/content/`, {
				auth: { username, password },
				formData: { content, 'i18n_type': 'PO' }
			}, ( error, response, body ) => {
				if ( error ) {
					reject( error );
				} else {
					resolve( JSON.parse( body ) );
				}
			} );
		} );
	},

	/**
	 * Returns resource details promise.
	 *
	 * @param {Object} config
	 * @param {String} config.username Username for the Transifex account.
	 * @param {String} config.password Username for the Transifex account.
	 * @param {String} config.slug Resource slug.
	 * @returns {Promise<Object>}
	 */
	getResourceDetails( { username, password, slug } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ slug }/?details`, {
				auth: { username, password }
			}, createJsonResponseHandler( resolve, reject ) );
		} );
	},

	/**
	 * Returns translations promise for the target resource and language.
	 *
	 * @param {Object} config
	 * @param {String} config.username Username for the Transifex account.
	 * @param {String} config.password Username for the Transifex account.
	 * @param {String} config.slug Resource slug.
	 * @param {String} config.lang Target language.
	 * @returns {Promise<Object>}
	 */
	getTranslation( { username, password, slug, lang } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ slug }/translation/${ lang }/`, {
				auth: { username, password }
			}, createJsonResponseHandler( resolve, reject ) );
		} );
	}
};

// Creates handler for the get requests in the promise wrappers.
function createJsonResponseHandler( resolve, reject ) {
	return function handleJsonResponse( error, response, body ) {
		if ( error ) {
			return reject( error );
		}  else if ( response.statusCode !== 200 ) {
			return reject( new Error( `Status code: ${response.statusCode}` ) );
		}
		resolve( JSON.parse( body ) );
	};
}
