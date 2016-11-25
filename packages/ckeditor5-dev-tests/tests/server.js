/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, before, after */

'use strict';

const http = require( 'http' );
const path = require( 'path' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const proxyquire = require( 'proxyquire' );

describe( 'Server', () => {
	let server, infoSpy, warningSpy, errorSpy;

	before( () => {
		const sourcePath = path.join( __dirname, '_build' );
		const serverRoot = path.join( sourcePath, 'manual-tests' );

		server = proxyquire( '../lib/server', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					infoSpy = sinon.spy();
					warningSpy = sinon.spy();
					errorSpy = sinon.spy();

					return {
						info: infoSpy,
						warning: warningSpy,
						error: errorSpy
					};
				}
			}
		} )( sourcePath, serverRoot );
	} );

	after( () => {
		server.close();
	} );

	it( 'starts the server', () => {
		expect( server ).to.have.property( 'close' );
		expect( infoSpy.calledOnce ).to.equal( true );
		expect( infoSpy.firstCall.args[ 0 ] ).to.equal( '[Server] Server running at http://localhost:8125/' );
	} );

	describe( 'returns HTTP Code #200 for', () => {
		it( '/index.html', () => {
			return sendRequest( '/' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.match( new RegExp( 'tests/engine/test.html' ) );
				} );
		} );

		it( '/theme/ckeditor.css', () => {
			return sendRequest( '/theme/ckeditor.css' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.match( new RegExp( 'An example Stylesheet.' ) );
				} );
		} );

		it( '/favicon.ico', () => {
			return sendRequest( '/favicon.ico' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.equal( '' );
				} );
		} );

		it( '/engine/test.html', () => {
			return sendRequest( '/engine/test.html' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.match( new RegExp( '<b>Engine</b> / <i>Test</i>' ) );
				} );
		} );

		it( '/engine/test.js', () => {
			return sendRequest( '/engine/test.js' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.match( new RegExp( 'Example script' ) );
				} );
		} );

		it( '/engine/test.jpg', () => {
			return sendRequest( '/engine/test.jpg' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.equal( '' );
				} );
		} );

		it( '/engine/test.png', () => {
			return sendRequest( '/engine/test.png' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( data.html ).to.equal( '' );
				} );
		} );

		it( '/engine/test.json', () => {
			return sendRequest( '/engine/test.json' )
				.then( ( data ) => {
					expect( data.response.statusCode ).to.equal( 200 );
					expect( JSON.parse( data.html ) ).to.deep.equal( { isTest: true } );
				} );
		} );
	} );

	describe( 'returns HTTP Code #500', () => {
		it( 'when file cannot be found', () => {
			return sendRequest( '/this-file-cannot-exist' )
				.then(
					() => {
						throw new Error( 'Promise was supposed to be rejected.' );
					},
					( data ) => {
						expect( data.response.statusCode ).to.equal( 500 );
						expect( data.html ).to.match( /Sorry, check with the site admin for error: / );
						expect( errorSpy.calledOnce ).to.equal( true );
						expect( errorSpy.firstCall.args[ 0 ] ).to.equal( `[Server] Cannot find file '/this-file-cannot-exist'.` );
					}
				);
		} );
	} );
} );

function sendRequest( url ) {
	return new Promise( ( resolve, reject ) => {
		http.get( `http://localhost:8125${ url }`, ( res ) => {
			let data = '';

			res.on( 'data', ( chunk ) => {
				data += chunk;
			} );

			res.on( 'end', () => {
				const response = {
					response: res,
					html: data
				};

				if ( res.statusCode >= 400 ) {
					reject( response );
				} else {
					resolve( response );
				}
			} );
		} );
	} );
}

