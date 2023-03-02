/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const webpack = require( 'webpack' );
const getWebpackConfigForManualTests = require( './getwebpackconfig' );
const getRelativeFilePath = require( '../getrelativefilepath' );
const requireDll = require( '../requiredll' );

/**
 * @param {Object} options
 * @param {String} options.cwd Current working directory. Usually it points to the CKEditor 5 root directory.
 * @param {String} options.buildDir A path where compiled files will be saved.
 * @param {Array.<String>} options.sourceFiles An array of paths to JavaScript files from manual tests to be compiled.
 * @param {String} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {String} options.language A language passed to `CKEditorTranslationsPlugin`.
 * @param {Boolean} options.disableWatch Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {Function} options.onTestCompilationStatus A callback called whenever the script compilation occurrs.
 * @param {String} [options.tsconfig] Path the TypeScript configuration file.
 * @param {Array.<String>} [options.additionalLanguages] Additional languages passed to `CKEditorTranslationsPlugin`.
 * @param {String} [options.identityFile] A file that provides secret keys used in the test scripts.
 * @returns {Promise}
 */
module.exports = function compileManualTestScripts( options ) {
	const entryFiles = options.sourceFiles;
	const entryFilesDLL = entryFiles.filter( entryFile => requireDll( entryFile ) );
	const entryFilesNonDll = entryFiles.filter( entryFile => !requireDll( entryFile ) );

	const webpackConfigCommon = {
		cwd: options.cwd,
		buildDir: options.buildDir,
		themePath: options.themePath,
		language: options.language,
		additionalLanguages: options.additionalLanguages,
		debug: options.debug,
		tsconfig: options.tsconfig,
		identityFile: options.identityFile,
		disableWatch: options.disableWatch,
		onTestCompilationStatus: options.onTestCompilationStatus
	};

	const webpackConfigs = [];

	// DLL and non-DLL manual tests needs to be compiled separately, because DLL tests require `DllReferencePlugin` and non-DLL ones
	// must not have it. Because of that, one or two separate webpack configs are produced and one or two separate webpack processes
	// are executed.
	if ( entryFilesDLL.length ) {
		const webpackConfigDll = getWebpackConfigForManualTests( {
			...webpackConfigCommon,
			requireDll: true,
			entries: getWebpackEntryPoints( entryFilesDLL )
		} );

		webpackConfigs.push( webpackConfigDll );
	}

	if ( entryFilesNonDll.length ) {
		const webpackConfigNonDll = getWebpackConfigForManualTests( {
			...webpackConfigCommon,
			requireDll: false,
			entries: getWebpackEntryPoints( entryFilesNonDll )
		} );

		webpackConfigs.push( webpackConfigNonDll );
	}

	const webpackPromises = webpackConfigs.map( config => runWebpack( config ) );

	return Promise.all( webpackPromises );
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
