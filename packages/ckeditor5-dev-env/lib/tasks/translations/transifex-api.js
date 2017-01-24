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

	getResourceDetails( { username, password, slug } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ slug }/?details`, {
				auth: { username, password }
			}, createJSONResponseHandler( resolve, reject ) );
		} );
	},

	getTranslation( { username, password, slug, lang } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ slug }/translation/${ lang }/`, {
				auth: { username, password }
			}, createJSONResponseHandler( resolve, reject ) );
		} );
	}
};

function createJSONResponseHandler( resolve, reject ) {
	return function handleJSONResponse( error, response, body ) {
		if ( error ) {
			return reject( error );
		}  else if ( response.statusCode !== 200 ) {
			return reject( new Error( `Status code: ${response.statusCode}` ) );
		}
		resolve( JSON.parse( body ) );
	};
}
