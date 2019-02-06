/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const fs = require( 'fs-extra' );
const _ = require( 'lodash' );
const chalk = require( 'chalk' );
const commonmark = require( 'commonmark' );
const combine = require( 'dom-combiner' );
const chokidar = require( 'chokidar' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const getRelativeFilePath = require( '../getrelativefilepath' );
const globSync = require( '../glob' );

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

/**
 * @param {String} buildDir A path where compiled files will be saved.
 * @param {Array.<String>} manualTestScriptsPatterns An array of patterns that resolves manual test scripts.
 * @returns {Promise}
 */
module.exports = function compileHtmlFiles( buildDir, manualTestScriptsPatterns ) {
	const viewTemplate = fs.readFileSync( path.join( __dirname, 'template.html' ), 'utf-8' );

	const sourceMDFiles = manualTestScriptsPatterns.reduce( ( arr, manualTestPattern ) => {
		return [
			...arr,
			...globSync( manualTestPattern )
				.filter( manualTestFile => manualTestFile.includes( path.sep + 'manual' + path.sep ) )
				.map( jsFile => setExtension( jsFile, 'md' ) )
		];
	}, [] );
	const sourceHtmlFiles = sourceMDFiles.map( mdFile => setExtension( mdFile, 'html' ) );

	const sourceDirs = _.uniq( sourceMDFiles.map( file => path.dirname( file ) ) );
	const sourceFilePathBases = sourceMDFiles.map( mdFile => getFilePathWithoutExtension( mdFile ) );
	const staticFiles = _.flatten( sourceDirs.map( sourceDir => {
		return globSync( path.join( sourceDir, '**', '*.!(js|html|md)' ) );
	} ) ).filter( file => !file.match( /\.(js|html|md)$/ ) );

	fs.ensureDirSync( buildDir );

	// Copy all files which can be found in the directories with manual tests
	// to the build dir.
	staticFiles.forEach( staticFile => copyStaticFile( buildDir, staticFile ) );

	// Generate real HTML files out of the MD + HTML files of each test.
	sourceFilePathBases.forEach( sourceFilePathBase => compileHtmlFile( buildDir, sourceFilePathBase, viewTemplate ) );

	// Watch files and compile on change.
	watchFiles( [ ...sourceMDFiles, ...sourceHtmlFiles ], file => {
		compileHtmlFile( buildDir, getFilePathWithoutExtension( file ), viewTemplate );
	} );
};

function compileHtmlFile( buildDir, sourceFilePathBase, viewTemplate ) {
	const log = logger();
	const sourceMDFilePath = sourceFilePathBase + '.md';
	const sourceHtmlFilePath = sourceFilePathBase + '.html';
	const sourceJSFilePath = sourceFilePathBase + '.js';

	const absoluteHtmlFilePath = getRelativeFilePath( sourceHtmlFilePath );
	const absoluteJSFilePath = getRelativeFilePath( sourceJSFilePath );

	log.info( `Processing '${ chalk.cyan( sourceFilePathBase ) }'...` );

	// Compile test instruction (Markdown file).
	const parsedMarkdownTree = reader.parse( fs.readFileSync( sourceMDFilePath, 'utf-8' ) );
	const manualTestInstruction =
		'<div class="manual-test-sidebar">' +
			'<a href="/" class="manual-test-root-link">&larr; Back to the list</a>' +
			writer.render( parsedMarkdownTree ) +
		'</div>';

	// Load test view (HTML file).
	const htmlView = fs.readFileSync( sourceHtmlFilePath, 'utf-8' );

	// Attach script file to the view.
	const scriptTag =
		'<body class="manual-test-container">' +
			`<script src="/${ absoluteJSFilePath }"></script>` +
		'</body>';

	// Concat the all HTML parts to single one.
	const preparedHtml = combine( viewTemplate, manualTestInstruction, htmlView, scriptTag );

	// Prepare output path.
	const outputFilePath = path.join( buildDir, absoluteHtmlFilePath );

	fs.outputFileSync( outputFilePath, preparedHtml );

	log.info( `Finished writing '${ chalk.cyan( outputFilePath ) }'` );
}

// Copies all non JS/HTML/MD files to build dir. Their relative paths to JS/HTML files are maintained.
function copyStaticFile( buildDir, staticFile ) {
	const outputFilePath = path.join( buildDir, getRelativeFilePath( staticFile ) );
	fs.copySync( staticFile, outputFilePath );
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
		const debouncedOnChange = _.debounce( () => onChange( filePath ), 500 );
		chokidar.watch( filePath, { ignoreInitial: true } ).on( 'all', debouncedOnChange );
	}
}
