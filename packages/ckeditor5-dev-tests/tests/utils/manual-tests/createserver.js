/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import http from 'http';
import readline from 'readline';
import fs from 'fs';
import { globSync } from 'tinyglobby';
import combine from 'dom-combiner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import createManualTestServer from '../../../lib/utils/manual-tests/createserver.js';

vi.mock( 'readline' );
vi.mock( 'fs' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'tinyglobby' );
vi.mock( 'dom-combiner' );

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

	describe( 'request handler', () => {
		beforeEach( () => {
			createManualTestServer( 'workspace/build/.manual-tests' );
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
