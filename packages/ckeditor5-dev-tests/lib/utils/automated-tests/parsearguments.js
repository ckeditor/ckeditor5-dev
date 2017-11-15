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
	const minimistConfig = {
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
			f: 'files',
			b: 'browsers'
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
	};
	const options = minimist( args, minimistConfig );

	options.accessKey = options[ 'access-key' ];
	options.sourceMap = options[ 'source-map' ];

	if ( options.username && options.accessKey ) {
		options.browserStack = true;
	}

	options.browsers = options.browsers.split( ',' );

	if ( typeof options.files === 'string' ) {
		options.files = options.files.split( ',' );
	}

	// Delete all aliases because we don't want to use them in the code.
	// They are useful when calling command but useless after that.
	for ( const alias of Object.keys( minimistConfig.alias ) ) {
		delete options[ alias ];
	}

	return options;
};
