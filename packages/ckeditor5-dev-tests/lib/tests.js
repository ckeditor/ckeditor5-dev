/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const gulpFilter = require( 'gulp-filter' );
const gulpRename = require( 'gulp-rename' );
const { stream, tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const { utils: docsUtils } = require( '@ckeditor/ckeditor5-dev-docs' );

const tasks = {
	/**
	 * @Todo: This task does not work! First we need to move to Karma + Webpack
	 * the testing environment. Then we will be able to fix this task.
	 *
	 * Prepares configurations for bundler based on sample files and builds editors
	 * based on prepared configuration.
	 *
	 * You can find more details in: https://github.com/ckeditor/ckeditor5/issues/260
	 *
	 * @param {String} rootDir Root of main project repository.
	 * @param {String} bundleDir Name of the directory for bundled packages.
	 * @param {String} testPath Old `config.MODULE_DIR.amd`. A path to the tests for AMD build.
	 * @param {String} samplesGlob Glob describing sample files to process.
	 * @returns {Stream}
	 */
	buildEditorsForSamples( rootDir,  bundleDir, testPath, samplesGlob ) {
		bundleDir = path.join( rootDir, bundleDir );

		const ckeditor5DevBundler = require( '@ckeditor/ckeditor5-dev-bundler-rollup' )( {
			ROOT_DIR: rootDir,
			MODULE_DIR: {
				esnext: ''
			},
			BUNDLE_DIR: bundleDir
		} );

		return docsUtils.getSamplesStream( rootDir, samplesGlob )
			.pipe( gulpFilter( ( file ) => path.extname( file.path ) === '.js' ) )
			.pipe( gulpRename( ( file ) => {
				file.dirname = file.dirname.replace( '/docs/samples', '' );
			} ) )
			.pipe( stream.noop( ( file ) => {
				const bundleConfig = docsUtils.getBundlerConfigFromSample( file.contents.toString( 'utf-8' ) );
				bundleConfig.format = 'iife';
				bundleConfig.path = file.path.match( /\/samples\/(.*)\.js$/ )[ 1 ];

				const splitPath = bundleConfig.path.split( path.sep );
				const packageName = splitPath[ 0 ];

				// Clean the output paths.
				return ckeditor5DevBundler.clean( bundleConfig )
					// Then bundle a editor.
					.then( () => ckeditor5DevBundler.generate( bundleConfig ) )
					// Then copy created files.
					.then( () => {
						const beginPath = splitPath.slice( 1, -1 ).join( path.sep ) || '.';
						const fileName = splitPath.slice( -1 ).join();
						const builtEditorPath = path.join( bundleDir, bundleConfig.path, bundleConfig.moduleName );
						const destinationPath = path.join.apply( null, [
							testPath,
							'tests',
							packageName,
							'samples',
							beginPath,
							'_assets',
							fileName
						] );

						// Copy editor builds to proper directory.
						return Promise.all( [
							tools.copyFile( `${ builtEditorPath }.js`, `${ destinationPath }.js` ),
							tools.copyFile( `${ builtEditorPath }.css`, `${ destinationPath }.css` )
						] );
					} )
					// And clean up.
					.then( () => tools.clean( path.join( bundleDir, packageName, '..' ), packageName ) );
			} ) );
	}
};

module.exports = tasks;
