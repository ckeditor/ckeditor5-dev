/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const http = require( 'http' );
const path = require( 'path' );
const fs = require( 'fs' );
const combine = require( 'dom-combiner' );
const utils = require( './utils' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Basic HTTP server. See http://stackoverflow.com/a/26354478.
 *
 * @param {String} sourcePath Base path where the compiler saved the files.
 * @param {String} serverRootPath Base path that will be used to find the static files.
 */
module.exports = ( sourcePath, serverRootPath ) => {
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
			const stylesheet = fs.readFileSync( path.join( sourcePath, 'theme', 'ckeditor.css' ) );

			return response.end( stylesheet, 'utf-8' );
		}

		// Generate index.html with list of the tests.
		if ( request.url === '/' ) {
			return response.end( generateIndex( sourcePath ), 'utf-8' );
		}

		// In other cases - return a static file.
		try {
			const content = fs.readFileSync( path.join( serverRootPath, request.url ) );

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
	const listElements = utils.getManualTestPaths( sourcePath )
		.map( ( testPath ) => {
			const cleanPath = utils.cleanPath( testPath ).replace( /\.js$/, '.html' );

			return `<li><a href="${ cleanPath }">${ cleanPath }</a></li>`;
		} );

	listElements.unshift( '<ul>' );
	listElements.push( '</ul>' );

	const headerHtml = `<body><h1>Available manual tests</h1></body>`;

	return combine( viewTemplate, headerHtml, listElements.join( '\n' ) );
}
