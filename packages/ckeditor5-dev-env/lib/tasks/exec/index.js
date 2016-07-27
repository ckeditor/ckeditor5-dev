/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const merge = require( 'merge-stream' );
const { log, workspace } = require( 'ckeditor5-dev-utils' );

/**
 * Execute given task with provided options and command-line parameters.
 *
 * @param {Function} execTask Task to use on each dependency.
 * @param {String} cwd Current working directory.
 * @param {Object} packageJSON Parsed `package.json` file from CKEditor 5 repository.
 * @param {String} workspaceRoot Relative path to workspace root.
 * @param {Object} params Parameters provided to the task via command-line.
 * @returns {Stream} Merged stream of processed files.
 */

module.exports = ( execTask, cwd, packageJSON, workspaceRoot, params ) => {
	const workspacePath = path.join( cwd, workspaceRoot );
	const mergedStream = merge();
	const specificRepository = params.repository;
	const includeRoot = !!params[ 'include-root' ];

	let devDirectories = workspace.getDevDirectories( workspacePath, packageJSON, cwd, includeRoot );

	if ( specificRepository ) {
		devDirectories = devDirectories.filter( ( dir ) => {
			return dir.repositoryURL === `ckeditor/${ specificRepository }`;
		} );
	}

	for ( const dir of devDirectories ) {
		try {
			log.out( `Executing task on ${ dir.repositoryURL }...` );

			const result = execTask( dir.repositoryPath, params );

			if ( result ) {
				mergedStream.add( result );
			}
		} catch ( err ) {
			log.err( err );
		}
	}

	return mergedStream;
};
