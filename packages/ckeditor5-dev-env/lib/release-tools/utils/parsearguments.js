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
 * @returns {Boolean} options.init Whether to create first release using this package.
 * @returns {Boolean} options.debug Whether to show additional logs.
 */
module.exports = function parseArguments( args = process.argv.slice( 2 ) ) {
	const options = require( 'minimist' )( args, {
		string: [
			'token'
		],

		boolean: [
			'init'
		],

		default: {
			init: false
		}
	} );

	return options;
};
