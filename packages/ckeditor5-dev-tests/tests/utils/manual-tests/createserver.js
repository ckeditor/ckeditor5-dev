/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import http from 'http';
import readline from 'readline';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import createManualTestServer from '../../../lib/utils/manual-tests/createserver.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'readline' );

describe( 'createManualTestServer()', () => {
	let loggerStub, server;

	beforeEach( async () => {
		const { createServer } = http;

		loggerStub = vi.fn();

		vi.mocked( logger ).mockReturnValue( {
			info: loggerStub
		} );

		vi.spyOn( http, 'createServer' ).mockImplementation( ( ...theArgs ) => {
			server = createServer( ...theArgs );

			vi.spyOn( server, 'listen' );

			return server;
		} );
	} );

	afterEach( () => {
		server.close();
	} );

	it( 'should start http server', () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( vi.mocked( http ).createServer ).toHaveBeenCalledOnce();
	} );

	it( 'should listen on given port', () => {
		createManualTestServer( 'workspace/build/.manual-tests', 8888 );

		expect( server ).toEqual( expect.objectContaining( {
			listen: expect.any( Function )
		} ) );

		expect( server.listen ).toHaveBeenCalledExactlyOnceWith( 8888 );
		expect( loggerStub ).toHaveBeenCalledExactlyOnceWith( '[Server] Server running at http://localhost:8888/' );
	} );

	it( 'should listen on 8125 port if no specific port was given', () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( server ).toEqual( expect.objectContaining( {
			listen: expect.any( Function )
		} ) );

		expect( server.listen ).toHaveBeenCalledExactlyOnceWith( 8125 );
		expect( loggerStub ).toHaveBeenCalledExactlyOnceWith( '[Server] Server running at http://localhost:8125/' );
	} );

	it( 'should call the specified callback when the server is running (e.g. to allow running web sockets)', () => {
		const spy = vi.fn();

		createManualTestServer( 'workspace/build/.manual-tests', 1234, spy );

		expect( spy ).toHaveBeenCalledExactlyOnceWith( server );
	} );

	it( 'should use "readline" to listen to the SIGINT event on Windows', () => {
		const readlineInterface = {
			on: vi.fn()
		};

		vi.mocked( readline ).createInterface.mockReturnValue( readlineInterface );
		vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'win32' );

		createManualTestServer( 'workspace/build/.manual-tests' );

		expect( vi.mocked( readline ).createInterface ).toHaveBeenCalledOnce();
		expect( readlineInterface.on ).toHaveBeenCalledExactlyOnceWith( 'SIGINT', expect.any( Function ) );
	} );
} );
