/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const webpack = require( 'webpack' );
const getWebpackConfigForManualTests = require( './getwebpackconfig' );
const getRelativeFilePath = require( '../getrelativefilepath' );

/**
 * @param {Object} options
 * @param {String} options.buildDir A path where compiled files will be saved.
 * @param {Array.<String>} options.sourceFiles An array of paths to JavaScript files from manual tests to be compiled.
 * @param {String} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {String} options.language A language passed to `CKEditorWebpackPlugin`.
 * @param {Boolean} options.disableWatch Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {Function} options.onTestCompilationStatus A callback called whenever the script compilation occurrs.
 * @param {Array.<String>} [options.additionalLanguages] Additional languages passed to `CKEditorWebpackPlugin`.
 * @param {String} [options.identityFile] A file that provides secret keys used in the test scripts.
 * @returns {Promise}
 */
module.exports = function compileManualTestScripts( options ) {
	const entryFiles = options.sourceFiles;
	const entries = getWebpackEntryPoints( entryFiles );
	const webpackConfig = getWebpackConfigForManualTests( {
		entries,
		buildDir: options.buildDir,
		themePath: options.themePath,
		language: options.language,
		additionalLanguages: options.additionalLanguages,
		debug: options.debug,
		identityFile: options.identityFile,
		disableWatch: options.disableWatch,
		onTestCompilationStatus: options.onTestCompilationStatus
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
