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

/**
 * @param {Object} config
 * @param {String} config.ROOT_DIR Root of main project repository.
 * @param {String} config.BUNDLE_DIR Name of the directory for bundled packages.
 * @param {Object} config.DOCUMENTATION
 * @param {String} config.DOCUMENTATION.SAMPLES Glob describing sample files to process.
 * @returns {Object} tasks
 */
module.exports = ( config ) => {
	const tasks = {
		/**
		 * Prepares configurations for bundler based on sample files and builds editors
		 * based on prepared configuration.
		 *
		 * You can find more details in: https://github.com/ckeditor/ckeditor5/issues/260
		 *
		 * @returns {Stream}
		 */
		buildEditorsForSamples() {
			const ckeditor5DevBundler = require( '@ckeditor/ckeditor5-dev-bundler-rollup' )( config );
			const bundleDir = path.join( config.ROOT_DIR, config.BUNDLE_DIR );

			return docsUtils.getSamplesStream( config.ROOT_DIR, config.DOCUMENTATION.SAMPLES )
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
								config.MODULE_DIR.amd,
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
						.then( () => tools.clean( path.join( config.BUNDLE_DIR, packageName, '..' ), packageName ) );
				} ) );
		}
	};

	return tasks;
};
