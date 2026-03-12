/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import webpack from 'webpack';
import getWebpackConfigForManualTests from './getwebpackconfig.js';
import getRelativeFilePath from '../getrelativefilepath.js';

/**
 * @param {object} options
 * @param {string} options.cwd Current working directory. Usually it points to the CKEditor 5 root directory.
 * @param {string} options.buildDir A path where compiled files will be saved.
 * @param {Array.<string>} options.sourceFiles An array of paths to JavaScript files from manual tests to be compiled.
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
	const webpackConfigCommon = {
		cwd: options.cwd,
		buildDir: options.buildDir,
		language: options.language,
		additionalLanguages: options.additionalLanguages,
		debug: options.debug,
		tsconfig: options.tsconfig,
		identityFile: options.identityFile,
		disableWatch: options.disableWatch,
		onTestCompilationStatus: options.onTestCompilationStatus
	};

	const webpackConfigs = [];

	if ( entryFiles.length ) {
		const webpackConfig = getWebpackConfigForManualTests( {
			...webpackConfigCommon,
			entries: getWebpackEntryPoints( entryFiles )
		} );

		webpackConfigs.push( webpackConfig );
	}

	const webpackPromises = webpackConfigs.map( config => runWebpack( config ) );

	return Promise.all( webpackPromises );
}

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
		entryObject[ getRelativeFilePath( file ).replace( /\.[jt]s$/, '' ) ] = file;
	} );

	return entryObject;
}
