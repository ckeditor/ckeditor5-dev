/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/* eslint-env node */

const path = require( 'path' );
const postcss = require( 'postcss' );
const postCssImport = require( 'postcss-import' );
const gutil = require( 'gulp-util' );
const log = require( '../logger' )();

const processor = postcss( {
	plugins: [ postCssImport() ]
} );

module.exports = postcss.plugin( 'postcss-ckeditor5-theme-importer', options => {
	// A path to the theme e.g. "/foo/bar/ckeditor5-theme-baz"
	const themePath = options.themePath;

	// "ckeditor5-theme-baz"
	const themeName = themePath.split( '/' ).slice( -1 );

	log.info( `Using theme "${ gutil.colors.cyan( themeName ) }".` );

	return ( root, result ) => {
		// A CSS file to be themed, e.g. "/foo/bar/ckeditor5-qux/theme/components/button.css"
		const inputFilePath = root.source.input.file;

		// "ckeditor5-qux"
		const packageName = getPackageName( inputFilePath );

		// "components/button.css"
		const inputFileName = inputFilePath.split( packageName + '/theme/' )[ 1 ];

		// Don't load theme file for files not belonging to "ckeditor5-*/theme" folder.
		if ( !inputFileName ) {
			return;
		}

		// A corresponding theme file e.g. "/foo/bar/ckeditor5-theme-baz/theme/ckeditor5-qux/components/button.css".
		const themeFilePath = path.resolve( __dirname, themePath, 'theme', packageName, inputFileName );

		log.info( `Using theme file for "${ gutil.colors.cyan( inputFilePath ) }".` );

		return processor
			.process(
				`@import "${ themeFilePath }";`,
				getProcessingOptions( themeFilePath, options )
			)
			.then( appendThemeFile( root, result, inputFilePath, themeFilePath ) )
			.catch( err => {
				if ( err.toString().match( 'Failed to find' ) ) {
					log.warning( `Couldn't load theme file for "${ gutil.colors.cyan( root.source.input.file ) }".` );
				} else {
					throw err;
				}
			} );
	};
} );

function getPackageName( path ) {
	const match = path.match( /ckeditor5-[^/]+/ );

	if ( match ) {
		return match[ 0 ];
	} else {
		return null;
	}
}

function getProcessingOptions( themeFilePath, pluginOptions ) {
	return {
		from: themeFilePath,
		to: themeFilePath,
		map: pluginOptions.sourceMap ? { inline: true } : false
	};
}

function appendThemeFile( root, result, inputFile, themeFilePath ) {
	return importResult => {
		log.info( `A theme file for "${ gutil.colors.cyan( root.source.input.file ) }" has been loaded.` );

		root.append( importResult.root.nodes );

		// Let the watcher know that the theme file should be observed too.
		result.messages.push( {
			type: 'dependency',
			file: themeFilePath,
			parent: inputFile,
		} );
	};
}
