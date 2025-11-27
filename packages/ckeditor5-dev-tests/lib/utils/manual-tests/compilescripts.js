/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import rspack from '@rspack/core';
import getWebpackConfigForManualTests from './getwebpackconfig.js';
import getRelativeFilePath from '../getrelativefilepath.js';
import requireDll from '../requiredll.js';

/**
 * @param {object} options
 * @param {string} options.cwd Current working directory. Usually it points to the CKEditor 5 root directory.
 * @param {string} options.buildDir A path where compiled files will be saved.
 * @param {Array.<string>} options.sourceFiles An array of paths to JavaScript files from manual tests to be compiled.
 * @param {string} options.themePath A path to the theme the PostCSS theme-importer plugin is supposed to load.
 * @param {string} options.language A language passed to `CKEditorTranslationsPlugin`.
 * @param {boolean} options.disableWatch Whether to disable the watch mechanism. If set to true, changes in source files
 * will not trigger webpack.
 * @param {function} options.onTestCompilationStatus A callback called whenever the script compilation occurrs.
 * @param {string} [options.tsconfig] Path the TypeScript configuration file.
 * @param {Array.<string>} [options.additionalLanguages] Additional languages passed to `CKEditorTranslationsPlugin`.
 * @param {string} [options.identityFile] A file that provides secret keys used in the test scripts.
 * @returns {Promise}
 */
export default function compileManualTestScripts( options ) {
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
}

/**
 * @returns {Promise}
 */
function runWebpack( webpackConfig ) {
	return new Promise( ( resolve, reject ) => {
		rspack( webpackConfig, err => {
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
		entryObject[ getRelativeFilePath( file ).replace( /\.[jt]s$/, '' ) ] = file;
	} );

	return entryObject;
}
