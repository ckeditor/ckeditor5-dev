/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import http from 'node:http';
import readline from 'node:readline';
import fs from 'node:fs';
import { globSync } from 'glob';
import combine from 'dom-combiner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import createManualTestServer from '../../../lib/utils/manual-tests/createserver.js';

vi.mock( 'node:readline' );
vi.mock( 'node:fs' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'glob' );
vi.mock( 'dom-combiner' );

describe( 'createManualTestServer()', () => {
	let loggerStub, server, servers;

	beforeEach( async () => {
		const { createServer } = http;

		servers = [];
		loggerStub = vi.fn();

		vi.mocked( logger ).mockReturnValue( {
			info: loggerStub
		} );

		vi.spyOn( http, 'createServer' ).mockImplementation( ( ...theArgs ) => {
			server = createServer( ...theArgs );
			servers.push( server );

			vi.spyOn( server, 'listen' );

			return server;
		} );
	} );

	afterEach( () => {
		for ( const s of servers ) {
			s.close();
		}
	} );

	it( 'should start http server', async () => {
		createManualTestServer( 'workspace/build/.manual-tests', 49700 );

		await vi.waitFor( () => {
			expect( loggerStub ).toHaveBeenCalled();
		} );

		expect( vi.mocked( http ).createServer ).toHaveBeenCalledOnce();
	} );

	it( 'should listen on given port', async () => {
		createManualTestServer( 'workspace/build/.manual-tests', 49888 );

		await vi.waitFor( () => {
			expect( loggerStub ).toHaveBeenCalled();
		} );

		expect( server ).toEqual( expect.objectContaining( {
			listen: expect.any( Function )
		} ) );

		expect( server.listen ).toHaveBeenCalledExactlyOnceWith( 49888, expect.any( Function ) );
		expect( loggerStub ).toHaveBeenCalledExactlyOnceWith( '[Server] Server running at http://localhost:49888/' );
	} );

	it( 'should listen on 8125 port if no specific port was given', async () => {
		createManualTestServer( 'workspace/build/.manual-tests' );

		await vi.waitFor( () => {
			expect( loggerStub ).toHaveBeenCalledWith(
				expect.stringContaining( '[Server] Server running at http://localhost:' )
			);
		} );

		expect( server ).toEqual( expect.objectContaining( {
			listen: expect.any( Function )
		} ) );

		// The first listen attempt should always be on the default port 8125, even if the server
		// ended up on a different port due to EADDRINUSE retries.
		expect( servers[ 0 ].listen ).toHaveBeenCalledWith( 8125, expect.any( Function ) );
	} );

	it( 'should call the specified callback when the server is running (e.g. to allow running web sockets)', async () => {
		const spy = vi.fn();

		createManualTestServer( 'workspace/build/.manual-tests', 49234, spy );

		await vi.waitFor( () => {
			expect( spy ).toHaveBeenCalled();
		} );

		expect( spy ).toHaveBeenCalledExactlyOnceWith( server );
	} );

	it( 'should use "readline" to listen to the SIGINT event on Windows', async () => {
		const readlineInterface = {
			on: vi.fn()
		};

		vi.mocked( readline ).createInterface.mockReturnValue( readlineInterface );
		vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'win32' );

		createManualTestServer( 'workspace/build/.manual-tests', 49900 );

		await vi.waitFor( () => {
			expect( vi.mocked( readline ).createInterface ).toHaveBeenCalled();
		} );

		expect( vi.mocked( readline ).createInterface ).toHaveBeenCalledOnce();
		expect( readlineInterface.on ).toHaveBeenCalledExactlyOnceWith( 'SIGINT', expect.any( Function ) );
	} );

	it( 'should try next port when the requested port is in use', async () => {
		// Occupy the port first.
		const blockingServer = http.createServer.getMockImplementation()();

		await new Promise( resolve => {
			blockingServer.listen( 49555, resolve );
		} );

		createManualTestServer( 'workspace/build/.manual-tests', 49555 );

		await vi.waitFor( () => {
			expect( loggerStub ).toHaveBeenCalledWith( '[Server] Server running at http://localhost:49556/' );
		} );

		expect( loggerStub ).toHaveBeenCalledWith( '[Server] Port 49555 is in use, trying 49556...' );

		blockingServer.close();
	} );

	it( 'should reject when a non-EADDRINUSE error occurs', async () => {
		const originalCreateServer = http.createServer.getMockImplementation();
		const fakeServer = originalCreateServer();

		servers.push( fakeServer );
		vi.spyOn( fakeServer, 'listen' ).mockImplementation( () => {
			// Simulate a non-EADDRINUSE error.
			process.nextTick( () => {
				fakeServer.emit( 'error', new Error( 'EACCES: permission denied' ) );
			} );
		} );
		vi.spyOn( fakeServer, 'close' ).mockImplementation( () => {} );

		vi.mocked( http.createServer ).mockReturnValue( fakeServer );

		await expect( createManualTestServer( 'workspace/build/.manual-tests', 49700 ) )
			.rejects.toThrow( 'EACCES: permission denied' );
	} );

	describe( 'request handler', () => {
		beforeEach( async () => {
			createManualTestServer( 'workspace/build/.manual-tests', 49800 );

			await vi.waitFor( () => {
				expect( loggerStub ).toHaveBeenCalled();
			} );
		} );

		it( 'should handle a request for a favicon (`/favicon.ico`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/favicon.ico'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'image/x-icon'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( null, 'utf-8' );
		} );

		it( 'should handle a root request (`/`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( '<template></template>' );
			vi.mocked( globSync ).mockReturnValue( [
				'/build/.manual-tests/ckeditor5-foo/tests/manual/test-1.html',
				'/build/.manual-tests/ckeditor5-foo/tests/manual/test-2.html',
				'/build/.manual-tests/ckeditor5-bar/tests/manual/test-3.html',
				'/build/.manual-tests/ckeditor5-bar/tests/manual/test-4.html'
			] );
			vi.mocked( combine ).mockReturnValue( 'Generated index.' );

			serverCallback( request, response );

			const expectedTestList =
				'<ul>' +
				'<li>' +
				'<strong>ckeditor5-bar</strong>' +
				'<ul>' +
				'<li><a href="/build/.manual-tests/ckeditor5-bar/tests/manual/test-3.html">test-3.html</a></li>' +
				'<li><a href="/build/.manual-tests/ckeditor5-bar/tests/manual/test-4.html">test-4.html</a></li>' +
				'</ul>' +
				'</li>' +
				'<li>' +
				'<strong>ckeditor5-foo</strong>' +
				'<ul>' +
				'<li><a href="/build/.manual-tests/ckeditor5-foo/tests/manual/test-1.html">test-1.html</a></li>' +
				'<li><a href="/build/.manual-tests/ckeditor5-foo/tests/manual/test-2.html">test-2.html</a></li>' +
				'</ul>' +
				'</li>' +
				'</ul>';

			expect( vi.mocked( combine ) ).toHaveBeenCalledExactlyOnceWith(
				'<template></template>',
				expect.stringContaining( 'CKEditor 5 manual tests' ),
				expectedTestList
			);

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'text/html'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'Generated index.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.html`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.html'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'text/html'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.js`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.js'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'text/javascript'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.json`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.json'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'application/json'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.js.map`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.js.map'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'application/json'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.css`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.css'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'text/css'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.png`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.png'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'image/png'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a static resource (`*.jpg`)', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.jpg'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( fs ).readFileSync.mockReturnValue( 'An example content.' );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 200, expect.objectContaining( {
				'Content-Type': 'image/jpg'
			} ) );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith( 'An example content.', 'utf-8' );
		} );

		it( 'should handle a request for a non-existing resource', () => {
			const [ firstCall ] = vi.mocked( http ).createServer.mock.calls;
			const [ serverCallback ] = firstCall;

			const request = {
				url: '/file.jpg'
			};
			const response = {
				writeHead: vi.fn(),
				end: vi.fn()
			};

			vi.mocked( logger ).mockReturnValue( {
				error: vi.fn()
			} );

			vi.mocked( fs ).readFileSync.mockImplementation( () => {
				const error = new Error( 'A resource does not exist' );
				error.code = 'ENOENT';

				throw error;
			} );

			serverCallback( request, response );

			expect( response.writeHead ).toHaveBeenCalledExactlyOnceWith( 404 );

			expect( response.end ).toHaveBeenCalledExactlyOnceWith(
				expect.stringContaining( 'Sorry, check with the site admin for error: ENOENT' ),
				'utf-8'
			);
		} );
	} );
} );
