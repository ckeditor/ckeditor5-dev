/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const request = require( 'request' );

const projectSlug = 'test-779';
const API_BASE = `http://www.transifex.com/api/2/project/${ projectSlug }`;

module.exports = {
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
			request.post( `${ API_BASE }/resource/${ slug }/content/`, {
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

	getTranslation( { username, password, name, lang } ) {
		return new Promise( ( resolve, reject ) => {
			request.get( `${ API_BASE }/resource/${ name }/translation/${ lang }/`, {
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
