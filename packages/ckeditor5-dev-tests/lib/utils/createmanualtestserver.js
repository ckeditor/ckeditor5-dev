/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */

'use strict';

const http = require( 'http' );
const path = require( 'path' );
const fs = require( 'fs' );
const combine = require( 'dom-combiner' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Basic HTTP server.
 *
 * @param {String} sourcePath Base path where the compiler saved the files.
 */
module.exports = function createManualTestServer( sourcePath ) {
	const log = logger();

	const server = http.createServer( ( request, response ) => {
		response.writeHead( 200, {
			'Content-Type': getContentType( request.url.endsWith( '/' ) ? '.html' : path.extname( request.url ) )
		} );

		// Ignore a 'favicon' request.
		if ( request.url === '/favicon.ico' ) {
			return response.end( null, 'utf-8' );
		}

		// Proxy for styles.
		if ( request.url === '/theme/ckeditor.css' ) {
			// const stylesheet = fs.readFileSync( path.join( sourcePath, 'theme', 'ckeditor.css' ) );
			return response.end( '' );
			// return response.end( stylesheet, 'utf-8' );
		}

		// Generate index.html with list of the tests.
		if ( request.url === '/' ) {
			return response.end( generateIndex( sourcePath ), 'utf-8' );
		}

		// In other cases - return a static file.
		try {
			const content = fs.readFileSync( path.join( sourcePath, request.url ) );

			response.end( content, 'utf-8' );
		} catch ( error ) {
			log.error( `[Server] Cannot find file '${ request.url }'.` );

			response.writeHead( 500 );
			response.end( `Sorry, check with the site admin for error: ${ error.code }...\n`, 'utf-8' );
		}
	} ).listen( 8125 );

	log.info( '[Server] Server running at http://localhost:8125/' );

	return server;
};

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
	const listElements = fs.readdirSync( sourcePath )
		.filter( f => fs.existsSync( path.join( sourcePath, f ) ) )
		.map( ( f ) => {
			let htmlPath = path.join( f, f + '.html' );

			if ( process.platform === 'win32' ) {
				htmlPath = htmlPath.replace( /\\/g, '/' );
			}

			return `<li><a href="${ htmlPath }">${ htmlPath }</a></li>`;
		} );

	listElements.unshift( '<ul>' );
	listElements.push( '</ul>' );

	const headerHtml = `<body><h1>CKEditor 5 manual tests</h1></body>`;

	return combine( viewTemplate, headerHtml, listElements.join( '\n' ) );
}
