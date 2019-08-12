/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
			'reporter'
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
			f: 'files',
			b: 'browsers'
		},

		default: {
			files: [],
			browsers: 'Chrome',
			reporter: 'mocha',
			watch: false,
			coverage: false,
			verbose: false,
			'source-map': false,
			server: false
		}
	};
	const options = minimist( args, minimistConfig );

	options.sourceMap = options[ 'source-map' ];
	options.browsers = options.browsers.split( ',' );

	if ( typeof options.files === 'string' ) {
		options.files = options.files.split( ',' );
	}

	options.language = options.language || 'en';
	options.additionalLanguages = options.additionalLanguages ? options.additionalLanguages.split( ',' ) : null;
	options.themePath = options.themePath ? options.themePath : null;

	// Delete all aliases because we don't want to use them in the code.
	// They are useful when calling command but useless after that.
	for ( const alias of Object.keys( minimistConfig.alias ) ) {
		delete options[ alias ];
	}

	return options;
};
