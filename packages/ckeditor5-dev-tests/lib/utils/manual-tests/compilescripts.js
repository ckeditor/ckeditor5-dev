/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const webpack = require( 'webpack' );
const globSync = require( '../glob' );
const getWebpackConfigForManualTests = require( './getwebpackconfig' );
const getRelativeFilePath = require( '../getrelativefilepath' );

/**
 * @param {String} buildDir A path where compiled files will be saved.
 * @param {Array.<String>} manualTestScriptsPatterns An array of patterns that resolve manual test scripts.
 * @returns {Promise}
 */
module.exports = function compileManualTestScripts( buildDir, manualTestScriptsPatterns, themePath ) {
	const entryFiles = manualTestScriptsPatterns.reduce( ( arr, manualTestPattern ) => {
		return [
			...arr,
			...globSync( manualTestPattern ).filter( manualTestFile => manualTestFile.includes( '/manual/' ) )
		];
	}, [] );

	// Compile each entry file in separate webpack process so the postcss theme importer
	// can load the theme entry point for each test.
	return Promise.all( entryFiles.map( entryFile => {
		const entry = getWebpackEntryPoint( entryFile );
		const webpackConfig = getWebpackConfigForManualTests( entry, buildDir, themePath );

		return runWebpack( webpackConfig );
	} ) );
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

function getWebpackEntryPoint( entryFile ) {
	return {
		[ getRelativeFilePath( entryFile ).replace( /\.js$/, '' ) ]: entryFile
	};
}
