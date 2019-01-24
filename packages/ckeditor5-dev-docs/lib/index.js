/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const tmp = require( 'tmp' );
const map = require( 'map-stream' );
const vfs = require( 'vinyl-fs' );

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

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

	const files = [];

	return new Promise( ( resolve, reject ) => {
		vfs.src( sourceFiles )
			.pipe( map( ( file, callback ) => {
				files.push( file.path );
				callback( null, file );
			} ).on( 'end', () => {
				const jsDocConfig = {
					plugins: [
						require.resolve( 'jsdoc/plugins/markdown' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/export-fixer/export-fixer' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/custom-tags/error' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/custom-tags/observable' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/observable-event-provider' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/relation-fixer' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/longname-fixer/longname-fixer' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/event-extender/event-extender' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/validator/validator' ),
						require.resolve( '@ckeditor/jsdoc-plugins/lib/utils/doclet-logger' )
					],
					source: {
						include: files
					},
					opts: {
						encoding: 'utf8',
						recurse: true,
						access: 'all',
						template: 'templates/silent'
					}
				};

				const tmpConfig = tmp.fileSync();

				fs.writeFile( tmpConfig.name, JSON.stringify( jsDocConfig ), 'utf8', error => {
					if ( error ) {
						return reject( error );
					}

					const cmd = require.resolve( 'jsdoc/jsdoc.js' );

					console.log( 'JSDoc started...' );

					try {
						tools.shExec( `${ cmd } -c ${ tmpConfig.name }`, { verbosity: 'info' } );
					} catch ( error ) {
						return reject( `Error during JSDoc generation: ${ error.message }` );
					}

					console.log( `Documented ${ files.length } files!` );

					resolve();
				} );
			} ) );
	} );
}
