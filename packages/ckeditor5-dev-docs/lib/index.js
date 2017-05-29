/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

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
 * @param {Boolean} [config.validateOnly=false] Whether JSDoc should only validate the documentation and finish
 * with error code `1`. If not passed, the errors will be printed to the console but the task will finish with `0`.
 * @returns {Promise}
 */
function build( config ) {
	const sourceFiles = [
		config.readmePath,
		...config.sourceFiles
	];

	const validateOnly = config.validateOnly || false;

	if ( validateOnly ) {
		process.env.JSDOC_VALIDATE_ONLY = true;
	}

	const jsDocConfig = {
		opts: {
			encoding: 'utf8',
			recurse: true,
			access: 'all',
			template: 'templates/silent'
		},
		plugins: [
			require.resolve( 'jsdoc/plugins/markdown' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/export-fixer/export-fixer' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/statics-augmentor/augmentor' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/longname-fixer/longname-fixer' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/validator/validator' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/utils/doclet-logger' )
		]
	};

	return new Promise( ( resolve, reject ) => {
		gulp.src( sourceFiles, { read: false } )
			.pipe( jsdoc( jsDocConfig, result => {
				if ( result instanceof Error ) {
					return reject( result.message );
				}

				return resolve( result );
			} ) );
	} );
}
