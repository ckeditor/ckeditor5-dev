/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimist = require( 'minimist' );

/**
 * @param {Array.<String>} args
 * @returns {Object}
 */
module.exports = function parseArguments( args ) {
	const options = minimist( args, {
		string: [
			'files',
			'browsers',
			'reporter',
			'username',
			'access-key'
		],

		boolean: [
			'watch',
			'coverage',
			'source-map',
			'verbose',
			'server'
		],

		alias: {
			w: 'watch',
			c: 'coverage',
			s: 'source-map',
			v: 'verbose',
			u: 'username',
			a: 'access-key',
			f: 'files'
		},

		default: {
			files: [],
			browsers: 'CHROME_LOCAL',
			reporter: 'mocha',
			watch: false,
			coverage: false,
			verbose: false,
			'source-map': false,
			server: false,
			browserStack: false
		}
	} );

	options.accessKey = options[ 'access-key' ];
	options.sourceMap = options[ 'source-map' ];

	if ( options.username && options.accessKey ) {
		options.browserStack = true;
	}

	options.browsers = options.browsers.split( ',' );

	if ( typeof options.files === 'string' ) {
		options.files = options.files.split( ',' );
		options.f = options.files; // Update an alias.
	}

	return options;
};
