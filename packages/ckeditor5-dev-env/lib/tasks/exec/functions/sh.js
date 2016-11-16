/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Runs custom shell command over each package.
 *
 * Example:
 *
 *		gulp exec --task sh --cmd "sed 's/find/replace' file.js"
 *
 * @param {String} workdir
 * @param {Object} params
 */
module.exports = function executeShellCommand( workdir, params ) {
	if ( !params.cmd ) {
		throw new Error( 'You must provide command to execute: --cmd "command"' );
	}

	// Log output to stdout/stderr.
	tools.shExec( `cd ${ workdir } && ${ params.cmd }` );
};
