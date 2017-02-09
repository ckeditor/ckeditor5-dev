/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const globSync = require( '../glob' );
const fs = require( 'fs-extra' );
const gutil = require( 'gulp-util' );
const commonmark = require( 'commonmark' );
const combine = require( 'dom-combiner' );
const getRelativeFilePath = require( '../getrelativefilepath' );

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

const viewTemplate = fs.readFileSync( path.join( __dirname, 'template.html' ), 'utf-8' );

module.exports = function compileManualTestHtmlFiles( buildDir, manualTestPattern ) {
	const sourceMDFiles = globSync( path.join( manualTestPattern, '*.md' ) );
	const sourceDirs = uniq( sourceMDFiles.map( file => path.dirname( file ) ) );

	fs.ensureDirSync( buildDir );

	// Copy all files which can be found in the directories with manual tests
	// to the build dir.
	sourceDirs.forEach( sourceDir => copyStaticFiles( buildDir, sourceDir ) );

	// Generate real HTML files out of the MD + HTML files of each test.
	sourceMDFiles.forEach( sourceFile => compileTestHtmlFile( buildDir, sourceFile ) );

	watchFiles( sourceMDFiles, ( mdFile ) => compileTestHtmlFile( buildDir, mdFile ) );
};

function compileTestHtmlFile( buildDir, sourceFile ) {
	const log = logger();

	const relativeFilePath = getRelativeFilePath( sourceFile );

	log.info( `Processing '${ gutil.colors.cyan( sourceFile ) }'...` );

	// Compile test instruction (Markdown file).
	const parsedMarkdownTree = reader.parse( fs.readFileSync( sourceFile, 'utf-8' ) );
	const manualTestInstructions = '<div class="manual-test-sidebar">' + writer.render( parsedMarkdownTree ) + '</div>';

	// Load test view (HTML file).
	const htmlView = fs.readFileSync( `${ changeExtension( sourceFile, 'html' ) }`, 'utf-8' );

	// Attach script file to the view.
	const scriptTag =
		'<body class="manual-test-container">' +
			`<script src="./${ changeExtension( path.basename( sourceFile ), 'js' ) }"></script>` +
		'</body>';

	// Concat the all HTML parts to single one.
	const preparedHtml = combine( viewTemplate, manualTestInstructions, htmlView, scriptTag );

	// Prepare output path.
	const outputFilePath = path.join( buildDir, changeExtension( relativeFilePath, 'html' ) );

	fs.outputFileSync( outputFilePath, preparedHtml );

	log.info( `Finished writing '${ gutil.colors.cyan( outputFilePath ) }'` );
}

// Copies all non JS/HTML/MD files to build dir. Their relative paths to JS/HTML files are maintained.
function copyStaticFiles( buildDir, sourceDir ) {
	const files = globSync( path.join( sourceDir, '**', '*.!(js|html|md)' ) );

	for ( const file of files ) {
		const outputFilePath = path.join( buildDir, getRelativeFilePath( file ) );
		fs.copySync( file, outputFilePath );
	}
}

function uniq( arr ) {
	return Array.from( new Set( arr ) );
}

function changeExtension( file, newExt ) {
	const { dir, name } = path.parse( file );

	return path.join( dir, name + '.' + newExt );
}

function watchFiles( filePaths, onChange ) {
	for ( const filePath of filePaths ) {
		watchFile( filePath, onChange );
	}
}

function watchFile( filePath, onChange ) {
	const debouncedOnChange = debounce( () => onChange( filePath ), 500 );
	fs.watch( filePath, debouncedOnChange );
}

function debounce( callback, delay ) {
	let timerId;

	return function( ...args ) {
		if ( timerId ) {
			clearTimeout( timerId );
		}

		timerId = setTimeout( () => {
			timerId = null;

			callback.apply( null, args );
		}, delay );
	};
}
