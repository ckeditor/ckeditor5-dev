/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import minimist from 'minimist';
import os from 'node:os';

/**
 * @param {Array.<string>} cliArguments
 * @returns {ReleaseOptions} options
 */
export default function parseArguments( cliArguments ) {
	const config = {
		boolean: [
			'verbose',
			'compile-only',
			'ci'
		],

		number: [
			'concurrency'
		],

		string: [
			'branch',
			'from',
			'npm-tag',
			'packages'
		],

		default: {
			concurrency: os.cpus().length / 2,
			packages: null,
			ci: false,
			verbose: false,
			'compile-only': false,
			branch: 'master',
			'npm-tag': null
		}
	};

	const options = minimist( cliArguments, config );

	if ( typeof options.packages === 'string' ) {
		options.packages = options.packages.split( ',' );
	}

	options.npmTag = options[ 'npm-tag' ];
	delete options[ 'npm-tag' ];

	options.compileOnly = options[ 'compile-only' ];
	delete options[ 'compile-only' ];

	if ( process.env.CI ) {
		options.ci = true;
	}

	return options;
}

/**
 * @typedef {Object} ReleaseOptions
 *
 * @property {number} concurrency
 *
 * @property {string|null} [npmTag=null]
 *
 * @property {Array.<string>|null} packages
 *
 * @property {string} [from]
 *
 * @property {string} [branch='master']
 *
 * @property {boolean} [compileOnly=false]
 *
 * @property {boolean} [verbose=false]
 *
 * @property {boolean} [ci=false]
 */
