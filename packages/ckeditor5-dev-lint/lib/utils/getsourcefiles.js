/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getGitIgnore = require( './getgitignore' );

/**
 * Gets the list of ignores from `.gitignore`.
 *
 * @param {Object} config
 * @param {Array.<String>} config.ignoredFiles Files that will be ignored.
 * @returns {Array.<String>}
 */
module.exports = function getSourceFiles( config ) {
	return [ '**/*.js' ]
		.concat( config.ignoredFiles.map( i => '!' + i ), getGitIgnore() );
};
