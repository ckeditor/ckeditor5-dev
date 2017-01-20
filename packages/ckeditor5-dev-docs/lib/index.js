/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const buildApiDocs = require( 'docs-builder/src/tasks/build-api-docs' );
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

			return buildApiDocs( sourceFiles, config.destinationPath, [], [] );
		} );
}
