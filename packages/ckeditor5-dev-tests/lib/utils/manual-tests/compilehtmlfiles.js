/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';
import { globSync } from 'glob';
import { uniq, debounce } from 'es-toolkit/compat';
import * as commonmark from 'commonmark';
import combine from 'dom-combiner';
import chokidar from 'chokidar';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import getRelativeFilePath from '../getrelativefilepath.js';

const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer();

/**
 * @param {object} options
 * @param {string} options.buildDir A path where compiled files will be saved.
 * @param {Array.<string>} options.sourceFiles An array of paths to JavaScript files from manual tests to be compiled.
 * @param {string} options.language A language passed to `CKEditorTranslationsPlugin`.
 * @param {boolean} options.disableWatch Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {Array.<string>} [options.additionalLanguages] Additional languages passed to `CKEditorTranslationsPlugin`.
 * @param {boolean} [options.silent=false] Whether to hide files that will be processed by the script.
 * @returns {Promise}
 */
export default function compileHtmlFiles( options ) {
	const buildDir = options.buildDir;
	const viewTemplate = fs.readFileSync( path.join( import.meta.dirname, 'template.html' ), 'utf-8' );
	const silent = options.silent || false;

	const sourceMDFiles = options.sourceFiles.map( jsFile => setExtension( jsFile, 'md' ) );
	const sourceHtmlFiles = sourceMDFiles.map( mdFile => setExtension( mdFile, 'html' ) );

	const sourceDirs = uniq( sourceMDFiles.map( file => path.dirname( file ) ) );
	const sourceFilePathBases = sourceMDFiles.map( mdFile => getFilePathWithoutExtension( mdFile ) );

	const staticFiles = sourceDirs
		.flatMap( sourceDir => {
			const globPattern = path.join( sourceDir, '**', '*.!(js|html|md)' ).split( /[\\/]/ ).join( '/' );

			return globSync( globPattern );
		} )
		.filter( file => !file.match( /\.(js|ts|html|md)$/ ) );

	const languagesToLoad = [];

	if ( options.additionalLanguages ) {
		languagesToLoad.push( options.language, ...options.additionalLanguages );
	}

	fs.mkdirSync( buildDir, { recursive: true } );

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
}

/**
 * @param {string} buildDir An absolute path to the directory where the processed file should be saved.
 * @param {object} options
 * @param {string} options.filePath An absolute path to the manual test assets without the extension.
 * @param {string} options.template The HTML template which will be merged with the manual test HTML file.
 * @param {Array.<string>} options.languages Name of translations that should be added to the manual test.
 * @param {boolean} options.silent Whether to hide files that will be processed by the script.
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
		log.info( `Processing '${ styleText( 'cyan', sourceFilePathBase ) }'...` );
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
		`<script>window.CKEDITOR_GLOBAL_LICENSE_KEY = "${ process.env.CKEDITOR_LICENSE_KEY || 'GPL' }";</script>` +
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

	fs.mkdirSync( path.dirname( outputFilePath ), { recursive: true } );
	fs.writeFileSync( outputFilePath, preparedHtml );

	if ( !silent ) {
		log.info( `Finished writing '${ styleText( 'cyan', outputFilePath ) }'` );
	}
}

// Copies all non JS/HTML/MD files to build dir. Their relative paths to JS/HTML files are maintained.
function copyStaticFile( buildDir, staticFile ) {
	const outputFilePath = path.join( buildDir, getRelativeFilePath( staticFile ) );

	fs.mkdirSync( path.dirname( outputFilePath ), { recursive: true } );
	fs.copyFileSync( staticFile, outputFilePath );
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
		const debouncedOnChange = debounce( () => {
			onChange( filePath );
			onTestCompilationStatus( 'finished' );
		}, 500 );

		chokidar.watch( filePath, { ignoreInitial: true } ).on( 'all', () => {
			onTestCompilationStatus( 'start' );
			debouncedOnChange();
		} );
	}
}
