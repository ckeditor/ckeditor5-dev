/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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
 * @param {Object} options
 * @param {String} options.buildDir A path where compiled files will be saved.
 * @param {Array.<String>} options.sourceFiles An array of paths to JavaScript files from manual tests to be compiled.
 * @param {String} options.language A language passed to `CKEditorTranslationsPlugin`.
 * @param {Boolean} options.disableWatch Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {Array.<String>} [options.additionalLanguages] Additional languages passed to `CKEditorTranslationsPlugin`.
 * @param {Boolean} [options.silent=false] Whether to hide files that will be processed by the script.
 * @returns {Promise}
 */
module.exports = function compileHtmlFiles( options ) {
	const buildDir = options.buildDir;
	const viewTemplate = fs.readFileSync( path.join( __dirname, 'template.html' ), 'utf-8' );
	const silent = options.silent || false;

	const sourceMDFiles = options.sourceFiles.map( jsFile => setExtension( jsFile, 'md' ) );
	const sourceHtmlFiles = sourceMDFiles.map( mdFile => setExtension( mdFile, 'html' ) );

	const sourceDirs = _.uniq( sourceMDFiles.map( file => path.dirname( file ) ) );
	const sourceFilePathBases = sourceMDFiles.map( mdFile => getFilePathWithoutExtension( mdFile ) );
	const staticFiles = _.flatten( sourceDirs.map( sourceDir => {
		return globSync( path.join( sourceDir, '**', '*.!(js|html|md)' ) );
	} ) ).filter( file => !file.match( /\.(js|html|md)$/ ) );
	const languagesToLoad = [];

	if ( options.additionalLanguages ) {
		languagesToLoad.push( options.language, ...options.additionalLanguages );
	}

	fs.ensureDirSync( buildDir );

	// Copy all files which can be found in the directories with manual tests
	// to the build dir.
	staticFiles.forEach( staticFile => copyStaticFile( buildDir, staticFile ) );

	// Generate real HTML files out of the MD + HTML files of each test.
	sourceFilePathBases.forEach( sourceFilePathBase => compileHtmlFile( buildDir, {
		filePath: sourceFilePathBase,
		template: viewTemplate,
		languages: languagesToLoad,
		silent
	} ) );

	// Watch files and compile on change.
	if ( !options.disableWatch ) {
		watchFiles( [ ...sourceMDFiles, ...sourceHtmlFiles ], file => {
			compileHtmlFile( buildDir, {
				filePath: getFilePathWithoutExtension( file ),
				template: viewTemplate,
				languages: languagesToLoad,
				silent
			} );
		}, options.onTestCompilationStatus );
	}
};

/**
 * @param {String} buildDir An absolute path to the directory where the processed file should be saved.
 * @param {Object} options
 * @param {String} options.filePath An absolute path to the manual test assets without the extension.
 * @param {String} options.template The HTML template which will be merged with the manual test HTML file.
 * @param {Array.<String>} options.languages Name of translations that should be added to the manual test.
 * @param {Boolean} options.silent Whether to hide files that will be processed by the script.
 */
function compileHtmlFile( buildDir, options ) {
	const sourceFilePathBase = options.filePath;
	const viewTemplate = options.template;
	const languagesToLoad = options.languages;
	const silent = options.silent;

	const log = logger();
	const sourceMDFilePath = sourceFilePathBase + '.md';
	const sourceHtmlFilePath = sourceFilePathBase + '.html';
	const sourceJSFilePath = sourceFilePathBase + '.js';

	const absoluteHtmlFilePath = getRelativeFilePath( sourceHtmlFilePath );
	const absoluteJSFilePath = getRelativeFilePath( sourceJSFilePath );

	if ( !silent ) {
		log.info( `Processing '${ chalk.cyan( sourceFilePathBase ) }'...` );
	}

	// Compile test instruction (Markdown file).
	const parsedMarkdownTree = reader.parse( fs.readFileSync( sourceMDFilePath, 'utf-8' ) );
	const manualTestInstruction =
		'<div class="manual-test-sidebar">' +
		writer.render( parsedMarkdownTree ) +
		'</div>';

	const manualTestSidebarToggleButton = '<button class="manual-test-sidebar__toggle" type="button" title="Toggle sidebar">' +
		'<span></span><span></span><span></span>' +
		'</button>';

	const manualTestSidebarBackButton = '<a href="/" class="manual-test-sidebar__root-link-button" title="Back to the list">' +
		'<span></span><span></span><span></span><span></span>' +
		'</button>';

	// Load test view (HTML file).
	const htmlView = fs.readFileSync( sourceHtmlFilePath, 'utf-8' );

	// Attach script file to the view.
	const scriptTag =
		'<body class="manual-test-container manual-test-container_no-transitions">' +
		'<script src="/assets/togglesidebar.js"></script>' +
		'<script src="/socket.io/socket.io.js"></script>' +
		'<script src="/assets/websocket.js"></script>' +
		'<script src="/assets/inspector.js"></script>' +
		'<script src="/assets/attachinspector.js"></script>' +
		`${ languagesToLoad.map( language => {
			return `<script src="/translations/${ language }.js"></script>`;
		} ).join( '' ) }` +
		`<script src="/${ absoluteJSFilePath.replace( /[\\/]/g, '/' ) }"></script>` +
		'</body>';

	// Concat the all HTML parts to single one.
	const preparedHtml = combine(
		viewTemplate,
		manualTestInstruction,
		manualTestSidebarToggleButton,
		manualTestSidebarBackButton,
		htmlView,
		scriptTag
	);

	// Prepare output path.
	const outputFilePath = path.join( buildDir, absoluteHtmlFilePath );

	fs.outputFileSync( outputFilePath, preparedHtml );

	if ( !silent ) {
		log.info( `Finished writing '${ chalk.cyan( outputFilePath ) }'` );
	}
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

function watchFiles( filePaths, onChange, onTestCompilationStatus ) {
	for ( const filePath of filePaths ) {
		const debouncedOnChange = _.debounce( () => {
			onChange( filePath );
			onTestCompilationStatus( 'finished' );
		}, 500 );

		chokidar.watch( filePath, { ignoreInitial: true } ).on( 'all', () => {
			onTestCompilationStatus( 'start' );
			debouncedOnChange();
		} );
	}
}
