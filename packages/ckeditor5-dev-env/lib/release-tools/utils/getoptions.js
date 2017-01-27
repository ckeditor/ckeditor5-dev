/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Parses command line arguments and returns them as a user-friendly hash.
 *
 * @returns {Object} options
 * @returns {String} options.token GitHub token used to authenticate.
 * @returns {Boolean} options.debug Whether to show additional logs.
 * @returns {Boolean} options.cwd Current working directory (packages) from which all paths will be resolved.
 * @returns {Boolean} options.packages Where to look for other packages (dependencies).
 */
module.exports = function getOptions( args = process.argv.slice( 2 ) ) {
	args = require( 'minimist' )( args, {
		string: [
			'token'
		]
	} );

	return Object.assign( {
		cwd: process.cwd(),
		packages: 'packages'
	}, args );
};
