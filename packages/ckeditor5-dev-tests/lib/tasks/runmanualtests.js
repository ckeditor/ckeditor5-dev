/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const webpack = require( 'webpack' );
const globSync = require( '../utils/glob' );
const createManualTestServer = require( '../utils/createmanualtestserver' );
const fs = require( 'fs-extra' );
const gutil = require( 'gulp-util' );
const commonmark = require( 'commonmark' );
const combine = require( 'dom-combiner' );
const getWebpackConfigForManualTests = require( '../utils/getwebpackconfigformanualtests' );

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

const viewTemplate = fs.readFileSync( path.join( __dirname, '..', 'utils', 'template.html' ), 'utf-8' );

const escapedPathSep = path.sep == '/' ? '/' : '\\\\';

/**
 * Main function that runs automated tests.
 *
 * @returns {Promise}
 */
module.exports = function runManualTests() {
	const buildDir = path.join( process.cwd(), 'build', '.manual-tests' );
	const manualTestPattern = path.join( process.cwd(), 'node_modules', 'ckeditor5-*', 'tests', '**', 'manual', '**' );

	return Promise.all( [
		compileScripts( buildDir, manualTestPattern ),
		compileTestHtmlFiles( buildDir, manualTestPattern )
	] )
	.then( () => createManualTestServer( buildDir ) );
};

function compileScripts( buildDir, manualTestPattern ) {
	const entryFiles = globSync( path.join( manualTestPattern, '*.js' ) );
	const entries = getWebpackEntryPoints( entryFiles );
	const webpackConfig = getWebpackConfigForManualTests( entries, buildDir );

	return runWebpack( webpackConfig, buildDir );
}

function compileTestHtmlFiles( buildDir, manualTestPattern ) {
	const sourceMDFiles = globSync( path.join( manualTestPattern, '*.md' ) );
	const sourceDirs = uniq( sourceMDFiles.map( file => path.dirname( file ) ) );

	fs.ensureDirSync( buildDir );

	// Copy all files which can be found in the directories with manual tests
	// to the build dir.
	sourceDirs.forEach( sourceDir => copyStaticFiles( buildDir, sourceDir ) );

	// Generate real HTML files out of the MD + HTML files of each test.
	sourceMDFiles.forEach( sourceFile => compileTestHtmlFile( buildDir, sourceFile ) );
}

/**
 * @returns {Promise}
 */
function runWebpack( webpackConfig ) {
	return new Promise( ( resolve, reject ) => {
		webpack( webpackConfig, ( err ) => {
			if ( err ) {
				reject( err );
			} else {
				resolve();
			}
		} );
	} );
}

function getWebpackEntryPoints( entryFiles ) {
	const entryObject = {};

	entryFiles.forEach( ( file ) => {
		entryObject[ getRelativeFilePath( file ).replace( /\.js$/, '' ) ] = file;
	} );

	return entryObject;
}

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

// Get a path to a source file which will uniquely identify this file in
// a build directory, once all package are gathered together.
//
// In order to do that, everything up to `ckeditor-*/` is removed:
// /work/space/ckeditor5-foo/tests/manual/foo.js -> ckeditor5-foo/tests/manual/foo.js
function getRelativeFilePath( filePath ) {
	return filePath.replace( new RegExp( '^.+?' + escapedPathSep + 'ckeditor5-' ), 'ckeditor5-' );
}

function uniq( arr ) {
	return Array.from( new Set( arr ) );
}

function changeExtension( file, newExt ) {
	const { dir, name } = path.parse( file );

	return path.join( dir, name + '.' + newExt );
}
