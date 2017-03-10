/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Returns object from `package.json`.
 *
 * This function is helpful for testing the whole process. Allows mocking the file
 * instead of create the fixtures.
 *
 * @returns {Object}
 */
module.exports = function getPackageJson( cwd = process.cwd() ) {
	return require( path.join( cwd, 'package.json' ) );
};
