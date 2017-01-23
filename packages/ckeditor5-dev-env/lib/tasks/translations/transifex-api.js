/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const request = require( 'request' );

const projectSlug = 'test-779';
const API_BASE = `http://www.transifex.com/api/2/project/${ projectSlug }`;

/**
 * Wrappers of the Transifex API.
 *
 * @see https://docs.transifex.com/api/ for API documentation.
 */
module.exports = {
	getResource( { username, password, slug } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ slug }/`, {
				auth: { username, password },
			}, ( error, response, body ) => {
				if ( error ) {
					reject( error );
				} else if ( response.statusCode !== 200 ) {
					reject( `Status code: ${ response.statusCode }` );
				} else {
					resolve( body );
				}
			} );
		} );
	},

	postResource( { username, password, name, slug, content } ) {
		return new Promise( ( resolve, reject ) => {
			request.post( `${ API_BASE }/resources/`, {
				auth: { username, password },
				formData: { slug, name, content, 'i18n_type': 'PO' }
			}, ( error, response, body ) => {
				if ( error ) {
					reject( error );
				} else {
					resolve( body );
				}
			} );
		} );
	},

	putResourceContent( { username, password, name, slug, content } ) {
		return new Promise( ( resolve, reject ) => {
			request.put( `${ API_BASE }/resource/${ slug }/content/`, {
				auth: { username, password },
				formData: { content, 'i18n_type': 'PO' }
			}, ( error, response, body ) => {
				if ( error ) {
					reject( error );
				} else {
					resolve( body );
				}
			} );
		} );
	},

	getTranslation( { username, password, slug, lang } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ slug }/translation/${ lang }/`, {
				auth: { username, password }
			}, ( error, response, body ) => {
				if ( error ) {
					reject( error );
				} else {
					resolve( body );
				}
			} );
		} );
	}
};
