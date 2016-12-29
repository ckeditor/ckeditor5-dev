/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const docsBuilder = require( 'docs-builder' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const utils = require( './utils' );

/**
 * Exports function returning documentation building tasks.
 *
 * @param {Object} config
 * @param {String} config.ROOT_DIR Root of main project repository.
 * @param {String} config.MODULE_DIR.esnext Path to esnext build of CKEditor 5. Relative to ROOT_DIR.
 * @param {Object} config.DOCUMENTATION
 * @param {String} config.DOCUMENTATION.TEMPORARY_DIR Path to the temporary documentation files.
 * @param {String} config.DOCUMENTATION.BUNDLE_DIR Name of the directory for bundled packages.
 * @param {String} config.DOCUMENTATION.DESTINATION_DIR Path to destination directory.
 * @param {String} config.DOCUMENTATION.SAMPLES Glob describing sample files to process.
 * @param {String} config.DOCUMENTATION.GUIDES Glob describing guides files to process.
 * @returns {Object}
 */
module.exports = ( config ) => {
	const tasks = {
		/**
		 * Builds CKEditor 5 documentation.
		 *
		 * @returns {Promise}
		 */
		buildDocs() {
			const options = utils.parseArguments();
			// Absolute path to root directory of project.
			const projectRoot = path.resolve( config.ROOT_DIR );
			// Absolute path to "esnext" build of project.
			const esnextBuildPath = path.join( projectRoot, config.MODULE_DIR.esnext );

			const builderConfig = {
				isDev: options.dev,
				name: 'CKEditor 5 Documentation',
				disqusUrl: 'ckeditor5-docs',
				destinationPath: path.join( projectRoot, config.DOCUMENTATION.DESTINATION_DIR ),
				configPaths: utils.getDocumentationConfigPaths( config.ROOT_DIR ),
				indexFile: `${ projectRoot }/README.md`,
				archiveName: 'ckeditor5-documentation.zip',
				jsDocFiles: [
					`${ projectRoot }/README.md`,
					`${ esnextBuildPath }/**/*.@(js|jsdoc)`,
					`!${ esnextBuildPath }/ckeditor5/*/lib/**/*`,
					`!${ esnextBuildPath }/tests/**/*`,
				]
			};

			return docsBuilder( builderConfig );
		},

		/**
		 * Remove all documentation files.
		 *
		 * @returns {Promise}
		 */
		clean() {
			return tools.clean( config.DOCUMENTATION.DESTINATION_DIR, '.' );
		}
	};

	return tasks;
};
