/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const fs = require( 'fs' );
const path = require( 'path' );
const postcss = require( 'postcss' );
const postCssImport = require( 'postcss-import' );
const gutil = require( 'gulp-util' );
const log = require( '../logger' )();

module.exports = postcss.plugin( 'postcss-ckeditor5-theme-importer', pluginOptions => {
	let isThemeEntryLoaded = false;

	return ( root, result ) => {
		const options = Object.assign( {}, pluginOptions, {
			postCssOptions: {
				plugins: [ postCssImport() ]
			},
			root, result,
		} );

		if ( isThemeEntryLoaded ) {
			return importThemeFile( options );
		} else {
			isThemeEntryLoaded = true;

			return importThemeEntryPoint( options )
				.then( importThemeFile( options ) );
		}
	};
} );

function importThemeEntryPoint( options ) {
	const themeEntryPath = path.resolve( __dirname, options.themePath );

	log.info( `[Theme] Loading entry point "${ gutil.colors.cyan( themeEntryPath ) }".` );

	options.fileToImport = themeEntryPath;
	options.fileToImportParent = themeEntryPath;

	return importFile( options );
}

function importThemeFile( options ) {
	const inputFilePath = options.root.source.input.file;

	// A corresponding theme file e.g. "/foo/bar/ckeditor5-theme-baz/theme/ckeditor5-qux/components/button.css".
	const themeFilePath = getThemeFilePath( options.themePath, inputFilePath );

	if ( themeFilePath ) {
		log.info( `[Theme] Loading for "${ gutil.colors.cyan( inputFilePath ) }".` );

		options.fileToImport = themeFilePath;
		options.fileToImportParent = inputFilePath;

		return importFile( options );
	}
}

function importFile( options ) {
	const { root, result, sourceMap } = options;
	const file = options.fileToImport;
	const parent = options.fileToImportParent;
	const processingOptions = {
		from: file,
		to: file,
		map: sourceMap ? { inline: true } : false
	};

	if ( !fs.existsSync( file ) ) {
		log.info( `[Theme] Failed to find "${ gutil.colors.yellow( file ) }".` );

		return;
	}

	return postcss( options.postCssOptions )
		.process( `@import "${ file }";`, processingOptions )
		.then( importResult => {
			// Merge the CSS trees.
			root.append( importResult.root.nodes );

			// Let the watcher know that the theme file should be observed too.
			result.messages.push( {
				file, parent,
				type: 'dependency'
			} );

			log.info( `[Theme] Loaded "${ gutil.colors.green( file ) }".` );
		} )
		.catch( error => {
			throw error;
		} );
}

// A CSS file to be themed, e.g. "/foo/bar/ckeditor5-qux/theme/components/button.css"
function getThemeFilePath( themePath, inputFilePath ) {
	// ckeditor5-theme-foo/theme/theme.css -> ckeditor5-theme-foo/theme
	themePath = path.dirname( themePath );

	// "ckeditor5-qux"
	const packageName = getPackageName( inputFilePath );

	// Don't load theme file for files not belonging to "ckeditor5-*/theme" folder.
	if ( !packageName ) {
		return;
	}

	// "components/button.css"
	const inputFileName = inputFilePath.split( packageName + '/theme/' )[ 1 ];

	// A corresponding theme file e.g. "/foo/bar/ckeditor5-theme-baz/theme/ckeditor5-qux/components/button.css".
	return path.resolve( __dirname, themePath, packageName, inputFileName );
}

function getPackageName( inputFilePath ) {
	const match = inputFilePath.match( /ckeditor5-[^/]+/g );

	if ( match ) {
		return match.pop();
	} else {
		return null;
	}
}
