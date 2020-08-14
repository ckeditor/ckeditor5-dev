/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const webpack = require( 'webpack' );
const globSync = require( '../glob' );
const getWebpackConfigForManualTests = require( './getwebpackconfig' );
const getRelativeFilePath = require( '../getrelativefilepath' );

/**
 * @param {Object} options
 * @param {String} options.buildDir A path where compiled files will be saved.
 * @param {Array.<String>} options.patterns An array of patterns that resolve manual test scripts.
 * @param {String} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {String} options.language A language passed to `CKEditorWebpackPlugin`.
 * @param {Array.<String>} [options.additionalLanguages] Additional languages passed to `CKEditorWebpackPlugin`.
 * @returns {Promise}
 */
module.exports = function compileManualTestScripts( options ) {
	const entryFiles = options.patterns.reduce( ( arr, manualTestPattern ) => {
		return [
			...arr,
			...globSync( manualTestPattern )
				// Accept only files saved in the `/manual/` directory.
				.filter( manualTestFile => manualTestFile.includes( path.sep + 'manual' + path.sep ) )
				// But do not parse manual tests utils saved in the `/manual/_utils/` directory.
				.filter( manualTestFile => !manualTestFile.includes( path.sep + 'manual' + path.sep + '_utils' + path.sep ) )
		];
	}, [] );

	const entries = getWebpackEntryPoints( entryFiles );
	const webpackConfig = getWebpackConfigForManualTests( {
		entries,
		buildDir: options.buildDir,
		themePath: options.themePath,
		language: options.language,
		additionalLanguages: options.additionalLanguages,
		debug: options.debug
	} );

	return runWebpack( webpackConfig );
};

/**
 * @returns {Promise}
 */
function runWebpack( webpackConfig ) {
	return new Promise( ( resolve, reject ) => {
		webpack( webpackConfig, err => {
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

	entryFiles.forEach( file => {
		entryObject[ getRelativeFilePath( file ).replace( /\.js$/, '' ) ] = file;
	} );

	return entryObject;
}
