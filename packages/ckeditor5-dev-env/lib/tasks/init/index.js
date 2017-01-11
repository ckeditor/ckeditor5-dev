/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { workspace, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const gutil = require( 'gulp-util' );

/**
 * 1. Get CKEditor5 dependencies from package.json file.
 * 2. Run install task on each dependency.
 *
 * @param {Function} installTask Install task to use on each dependency.
 * @param {String} ckeditor5Path Path to main CKEditor5 repository.
 * @param {Object} packageJSON Parsed package.json file from CKEditor5 repository.
 * @param {String} workspaceRoot Relative path to workspace root.
 */
module.exports = ( installTask, ckeditor5Path, packageJSON, workspaceRoot ) => {
	const log = logger();

	// Get all CKEditor dependencies from package.json.
	const dependencies = workspace.getDependencies( packageJSON.dependencies );

	if ( dependencies ) {
		for ( let dependency in dependencies ) {
			const repositoryURL = dependencies[ dependency ];
			log.info( gutil.colors.cyan( dependency ) );
			installTask( ckeditor5Path, workspaceRoot, repositoryURL );
		}
	} else {
		log.info( 'No CKEditor5 dependencies (ckeditor5-) found in package.json file.' );
	}
};
