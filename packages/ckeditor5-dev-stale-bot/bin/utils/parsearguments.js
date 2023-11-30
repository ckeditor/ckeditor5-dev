/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const minimist = require( 'minimist' );

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
		configPath: options[ 'config-path' ]
	};
};
