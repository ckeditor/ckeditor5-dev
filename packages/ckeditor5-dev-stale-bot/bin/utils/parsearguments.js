/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimist = require( 'minimist' );
const upath = require( 'upath' );

/**
 * Parses CLI arguments.
 *
 * @param {Array.<String>} args
 * @returns {Object} result
 * @returns {Boolean} result.dryRun
 * @returns {String} result.configPath
 */
module.exports = function parseArguments( args ) {
	const config = {
		boolean: [
			'dry-run'
		],

		string: [
			'config-path'
		],

		default: {
			'dry-run': false,
			'config-path': ''
		}
	};

	const options = minimist( args, config );

	return {
		dryRun: options[ 'dry-run' ],
		configPath: upath.join( process.cwd(), options[ 'config-path' ] )
	};
};
