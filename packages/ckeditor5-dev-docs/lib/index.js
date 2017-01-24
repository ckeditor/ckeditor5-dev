/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const path = require( 'path' );
const gulp = require( 'gulp' );
const jsdoc = require( 'gulp-jsdoc3' );

module.exports = {
	build
};

/**
 * Builds CKEditor 5 documentation.
 *
 * @param {Object} config
 * @param {Array.<String>} config.sourceFiles Glob pattern with source files.
 * @param {String} config.readmePath Path to `README.md`.
 * @param {String} config.destinationPath Path under which documentation should be generated.
 * @returns {Promise}
 */
function build( config ) {
	return tools.clean( config.destinationPath, '.' )
		.then( () => {
			const sourceFiles = [
				config.readmePath,
				...config.sourceFiles
			];

			const jsDocConfig = {
				opts: {
					encoding: 'utf8',
					destination: path.join( config.destinationPath, 'api' ),
					recurse: true,
					access: 'all'
				},
				plugins: [
					'node_modules/jsdoc/plugins/markdown',
					path.resolve( __dirname, '../node_modules/@ckeditor/jsdoc-plugins/lib/export-fixer/export-fixer' ),
					path.resolve( __dirname, '../node_modules/@ckeditor/jsdoc-plugins/lib/longname-fixer/longname-fixer' ),
					path.resolve( __dirname, '../node_modules/@ckeditor/jsdoc-plugins/lib/validator/validator' ),
					path.resolve( __dirname, '../node_modules/@ckeditor/jsdoc-plugins/lib/utils/doclet-logger' )
				]
			};

			return new Promise( ( resolve ) => {
				gulp.src( sourceFiles, { read: false } )
					.pipe( jsdoc( jsDocConfig, resolve ) );
			} );
		} );
}
