/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const minimist = require( 'minimist' );

/**
 * @param {Array.<String>} cliArguments
 * @returns {ReleaseOptions} options
 */
module.exports = function parseArguments( cliArguments ) {
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
			concurrency: require( 'os' ).cpus().length / 2,
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
};

/**
 * @typedef {Object} ReleaseOptions
 *
 * @property {Number} concurrency
 *
 * @property {String|null} [npmTag=null]
 *
 * @property {Array.<String>|null} packages
 *
 * @property {String} [from]
 *
 * @property {String} [branch='master']
 *
 * @property {Boolean} [compileOnly=false]
 *
 * @property {Boolean} [verbose=false]
 *
 * @property {Boolean} [ci=false]
 */
