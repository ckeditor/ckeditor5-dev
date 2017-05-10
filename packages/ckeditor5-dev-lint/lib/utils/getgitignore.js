/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );

/**
 * Gets the list of ignores from `.gitignore`.
 *
 * @returns {Array.<String>}
 */
module.exports = function getGitIgnore() {
	const gitIgnoredFiles = fs.readFileSync( '.gitignore', 'utf8' );

	return gitIgnoredFiles
		// Remove comment lines.
		.replace( /^#.*$/gm, '' )
		// Transform into array.
		.split( /\n+/ )
		// Remove empty entries.
		.filter( path => !!path )
		// Add `!` for ignore glob.
		.map( i => '!' + i );
};
