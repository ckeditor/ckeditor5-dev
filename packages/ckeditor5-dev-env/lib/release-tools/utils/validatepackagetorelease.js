/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * @param {Object} options
 * @param {String} options.version Version of the current release.
 * @param {String} options.changes Changelog entries for the current release.
 * @returns {Array.<String>}
 */
module.exports = function validatePackageToRelease( options ) {
	const errors = [];

	// Check whether the repository is ready for the release.
	const status = exec( 'git status -sb', { verbosity: 'error' } ).trim();

	// This way we'll catch if a branch is behind/ahead or contains uncommited files.
	if ( status !== '## master...origin/master' ) {
		errors.push( 'Not on master or master is not clean.' );
	}

	if ( !options.version ) {
		errors.push( `Passed an invalid version ("${ options.version }").` );

		return errors;
	}

	// Check whether the changelog entries are correct.
	if ( !options.changes ) {
		errors.push( `Cannot find changelog entries for version "${ options.version }".` );
	}

	return errors;

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
};
