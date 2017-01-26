/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Returns version of current package.
 *
 * @param {String} [cwd=process.cwd()] Current work directory.
 * @returns {String}
 */
module.exports = function getCurrentVersion( cwd = process.cwd() ) {
	const packageJson = require( path.join( cwd, 'package.json' ) );

	return `v${ packageJson.version }`;
};
