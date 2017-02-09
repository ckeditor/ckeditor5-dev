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
	const sourceMdFiles = globSync( path.join( manualTestPattern, '*.md' ) );
	const sourceHtmlFiles = sourceMdFiles.map( ( mdFile ) => setExtension( mdFile, 'html' ) );
	const sourceDirs = uniq( sourceMdFiles.map( file => path.dirname( file ) ) );
	const sourceFilePathBases = sourceMdFiles.map( ( mdFile ) => getFilePathWithoutExtension( mdFile ) );

	fs.ensureDirSync( buildDir );

	// Copy all files which can be found in the directories with manual tests
	// to the build dir.
	sourceDirs.forEach( sourceDir => copyStaticFiles( buildDir, sourceDir ) );

	// Generate real HTML files out of the MD + HTML files of each test.
	sourceFilePathBases.forEach( sourceFilePathBase => compileTestHtmlFile( buildDir, sourceFilePathBase ) );

	// Watch file and compile on change.
	watchFiles( sourceMdFiles, ( mdFile ) => compileTestHtmlFile( buildDir, getFilePathWithoutExtension( mdFile ) ) );
	watchFiles( sourceHtmlFiles, ( mdFile ) => compileTestHtmlFile( buildDir, getFilePathWithoutExtension( mdFile ) ) );
};

function compileTestHtmlFile( buildDir, sourceFilePathBase ) {
	const log = logger();
	const sourceMdFilePath = setExtension( sourceFilePathBase, 'md' );
	const sourceHtmlFilePath = setExtension( sourceFilePathBase, 'html' );
	const sourceJsFilePath = setExtension( sourceFilePathBase, 'js' );

	const relativeHtmlFilePath = getRelativeFilePath( sourceHtmlFilePath );
	const relativeJsFilePath = getRelativeFilePath( sourceJsFilePath );

	console.log( relativeJsFilePath );

	log.info( `Processing '${ gutil.colors.cyan( sourceFilePathBase ) }'...` );

	// Compile test instruction (Markdown file).
	const parsedMarkdownTree = reader.parse( fs.readFileSync( sourceMdFilePath, 'utf-8' ) );
	const manualTestInstructions = '<div class="manual-test-sidebar">' + writer.render( parsedMarkdownTree ) + '</div>';

	// Load test view (HTML file).
	const htmlView = fs.readFileSync( `${ sourceHtmlFilePath }`, 'utf-8' );

	// Attach script file to the view.
	const scriptTag =
		'<body class="manual-test-container">' +
			`<script src="/${ relativeJsFilePath }"></script>` +
		'</body>';

	// Concat the all HTML parts to single one.
	const preparedHtml = combine( viewTemplate, manualTestInstructions, htmlView, scriptTag );

	// Prepare output path.
	const outputFilePath = path.join( buildDir, relativeHtmlFilePath );

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

function setExtension( file, newExt ) {
	const { dir, name } = path.parse( file );

	return path.join( dir, name + '.' + newExt );
}

function getFilePathWithoutExtension( file ) {
	const { dir, name } = path.parse( file );

	return path.join( dir, name );
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
