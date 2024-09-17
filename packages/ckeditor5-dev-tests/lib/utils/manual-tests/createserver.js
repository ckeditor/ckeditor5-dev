/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import http from 'http';
import path from 'path';
import { globSync } from 'glob';
import fs from 'fs';
import combine from 'dom-combiner';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * Basic HTTP server.
 *
 * @param {String} sourcePath Base path where the compiler saved the files.
 * @param {Number} [port=8125] Port to listen at.
 * @param {Function} [onCreate] A callback called with the reference to the HTTP server when it is up and running.
 */
export default function createManualTestServer( sourcePath, port = 8125, onCreate ) {
	return new Promise( resolve => {
		const server = http.createServer( ( request, response ) => {
			onRequest( sourcePath, request, response );
		} ).listen( port );

		// SIGINT isn't caught on Windows in process. However, `CTRL+C` can be caught
		// by `readline` module. After that we can emit SIGINT to the process manually.
		if ( process.platform === 'win32' ) {
			const readline = require( 'readline' ).createInterface( {
				input: process.stdin,
				output: process.stdout
			} );

			// Save the reference of the stream to be able to close it in tests.
			server._readline = readline;

			readline.on( 'SIGINT', () => {
				process.emit( 'SIGINT' );
			} );
		}

		process.on( 'SIGINT', () => {
			if ( server ) {
				server.close();
			}

			resolve();
			process.exit();
		} );

		logger().info( `[Server] Server running at http://localhost:${ port }/` );

		if ( onCreate ) {
			onCreate( server );
		}
	} );
}

function onRequest( sourcePath, request, response ) {
	response.writeHead( 200, {
		'Content-Type': getContentType( request.url.endsWith( '/' ) ? '.html' : path.extname( request.url ) )
	} );

	// Ignore a 'favicon' request.
	if ( request.url === '/favicon.ico' ) {
		return response.end( null, 'utf-8' );
	}

	// Generate index.html with list of the tests.
	if ( request.url === '/' ) {
		return response.end( generateIndex( sourcePath ), 'utf-8' );
	}

	// In other cases - return a static file.
	try {
		// Remove the query part of the request.
		const url = request.url.replace( /\?.+$/, '' );
		const content = fs.readFileSync( path.join( sourcePath, url ) );

		response.end( content, 'utf-8' );
	} catch ( error ) {
		logger().error( `[Server] Cannot find file '${ request.url }'.` );

		response.writeHead( 404 );
		response.end( `Sorry, check with the site admin for error: ${ error.code }...\n`, 'utf-8' );
	}
}

// Returns content type based on file extension.
//
// @params {String} fileExtension
// @returns {String}
function getContentType( fileExtension ) {
	switch ( fileExtension ) {
		case '.js':
			return 'text/javascript';

		case '.css':
			return 'text/css';

		case '.json':
			return 'application/json';

		case '.png':
			return 'image/png';

		case '.ico':
			return 'image/x-icon';

		case '.jpg':
			return 'image/jpg';

		default:
			return 'text/html';
	}
}

// Generates a list with available manual tests.
//
// @param {String} sourcePath Base path that will be used to resolve all patterns.
// @returns {String}
function generateIndex( sourcePath ) {
	const viewTemplate = fs.readFileSync( path.join( __dirname, 'template.html' ), 'utf-8' );
	const globPattern = path.join( sourcePath, '**', '*.html' ).replace( /\\/g, '/' );
	const testFiles = globSync( globPattern ).sort( ( pathA, pathB ) => pathA.localeCompare( pathB ) );
	const testTree = {};

	let testList = '<ul>';

	for ( const file of testFiles ) {
		const relativeFilePath = file.replace( sourcePath + path.sep, '' );
		const packageName = relativeFilePath.match( /([^/\\]+)[/\\]tests[/\\]([^/\\]+[/\\])*manual/ )[ 1 ];
		const shortTestName = relativeFilePath.replace( /.*[/\\]manual[/\\]/g, '' ).replace( /[/\\]/g, '/' );

		if ( !testTree[ packageName ] ) {
			testTree[ packageName ] = [];
		}

		testTree[ packageName ].push( {
			relativeFilePath,
			shortTestName
		} );
	}

	for ( const packageName in testTree ) {
		testList += `<li><strong>${ packageName }</strong><ul>`;
		testList += testTree[ packageName ]
			.map( data => `<li><a href="${ data.relativeFilePath }">${ data.shortTestName }</a></li>` )
			.join( '' );
		testList += '</ul></li>';
	}

	const headerHtml = '<body class="manual-test-list-container"><h1>CKEditor 5 manual tests</h1></body>';

	return combine( viewTemplate, headerHtml, testList );
}
