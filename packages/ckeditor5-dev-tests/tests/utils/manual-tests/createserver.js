/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import http from 'http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import createManualTestServer from '../../../lib/utils/manual-tests/createserver.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );

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

		// To avoid false positives and encourage better testing practices, Mocha will no longer automatically
		// kill itself via `process.exit()` when it thinks it should be done running. Hence, we must close the stream
		// before leaving the test. See: https://stackoverflow.com/a/52143003.
		if ( server._readline ) {
			server._readline.close();
		}
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
} );
