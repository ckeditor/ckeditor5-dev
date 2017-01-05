/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint node: true, strict: true */

'use strict';

const path = require( 'path' );
const webpack = require( 'webpack' );
const globSync = require( '../utils/glob' );
const getWebpackConfigForManualTests = require( '../utils/getwebpackconfigformanualtests' );
const getRelativeFilePath = require( './getrelativefilepath' );

module.exports = function compileManualTestScripts( buildDir, manualTestPattern ) {
	const entryFiles = globSync( path.join( manualTestPattern, '*.js' ) );
	const entries = getWebpackEntryPoints( entryFiles );
	const webpackConfig = getWebpackConfigForManualTests( entries, buildDir );

	return runWebpack( webpackConfig );
};

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
