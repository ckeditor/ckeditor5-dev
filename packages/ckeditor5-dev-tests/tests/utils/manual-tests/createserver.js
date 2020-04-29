/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { use, expect } = require( 'chai' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
use( sinonChai );
const http = require( 'http' );

describe( 'createManualTestServer', () => {
	let sandbox, httpCreateServerStub, createManualTestServer, server;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		httpCreateServerStub = sandbox.stub( http, 'createServer' ).callsFake( function stubbedCreateServer( ...theArgs ) {
			server = httpCreateServerStub.wrappedMethod( ...theArgs );
			sandbox.spy( server, 'listen' );

			return server;
		} );

		createManualTestServer = require( '../../../lib/utils/manual-tests/createserver' );
	} );

	afterEach( () => {
		sandbox.restore();
		server.close();
	} );

	it( 'should start http server', () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( httpCreateServerStub ).to.be.calledOnce;
	} );

	it( 'should listen on given port', () => {
		createManualTestServer( 'workspace/build/.manual-tests', 8888 );

		expect( httpCreateServerStub.returnValues[ 0 ].listen ).to.be.calledOnceWith( 8888 );
	} );

	it( 'should listen on 8125 port if no specific port was given', () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( httpCreateServerStub.returnValues[ 0 ].listen ).to.be.calledOnceWith( 8125 );
	} );
} );
