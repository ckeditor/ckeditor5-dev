/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import minimist from 'minimist';
import upath from 'upath';

/**
 * Parses CLI arguments.
 *
 * @param {Array.<string>} args
 * @returns {object} result
 * @returns {boolean} result.dryRun
 * @returns {string} result.configPath
 */
export default function parseArguments( args ) {
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
}
