/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const http = require( 'http' );
const { use, expect } = require( 'chai' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const mockery = require( 'mockery' );

use( sinonChai );

describe( 'createManualTestServer', () => {
	let sandbox, httpCreateServerStub, createManualTestServer, server, loggerStub;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		loggerStub = sinon.stub();

		httpCreateServerStub = sandbox.stub( http, 'createServer' ).callsFake( function stubbedCreateServer( ...theArgs ) {
			server = httpCreateServerStub.wrappedMethod( ...theArgs );
			sandbox.spy( server, 'listen' );

			return server;
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger() {
				return {
					info: loggerStub
				};
			}
		} );

		createManualTestServer = require( '../../../lib/utils/manual-tests/createserver' );
	} );

	afterEach( () => {
		server.close();
		sandbox.restore();

		// To avoid false positives and encourage better testing practices, Mocha will no longer automatically
		// kill itself via `process.exit()` when it thinks it should be done running. Hence, we must close the stream
		// before leaving the test. See: https://stackoverflow.com/a/52143003.
		if ( server._readline ) {
			server._readline.close();
		}

		mockery.disable();
	} );

	it( 'should start http server', () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( httpCreateServerStub ).to.be.calledOnce;
	} );

	it( 'should listen on given port', () => {
		createManualTestServer( 'workspace/build/.manual-tests', 8888 );

		expect( httpCreateServerStub.returnValues[ 0 ].listen ).to.be.calledOnceWith( 8888 );

		expect( loggerStub.calledOnce ).to.equal( true );
		expect( loggerStub.firstCall.firstArg ).to.equal( '[Server] Server running at http://localhost:8888/' );
	} );

	it( 'should listen on 8125 port if no specific port was given', () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( httpCreateServerStub.returnValues[ 0 ].listen ).to.be.calledOnceWith( 8125 );

		expect( loggerStub.calledOnce ).to.equal( true );
		expect( loggerStub.firstCall.firstArg ).to.equal( '[Server] Server running at http://localhost:8125/' );
	} );
} );
