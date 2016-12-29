/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint browser: false, node: true, strict: true */

'use strict';

const minimist = require( 'minimist' );

/**
 * @param {Object} args
 * @returns {Object}
 */
module.exports = function parseArguments( args ) {
	const options = minimist( args, {
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
			'ignore-duplicates'
		],

		alias: {
			w: 'watch',
			c: 'coverage',
			s: 'source-map',
			v: 'verbose',
		},

		default: {
			files: [],
			browsers: 'Chrome',
			reporter: 'mocha',
			watch: false,
			coverage: false,
			verbose: false,
			'source-map': false,
			'ignore-duplicates': false
		}
	} );

	options.ignoreDuplicates = options[ 'ignore-duplicates' ];
	options.sourceMap = options[ 'source-map' ];
	options.browsers = options.browsers.split( ',' );

	if ( typeof options.files === 'string' ) {
		options.files = options.files.split( ',' );
	}

	return options;
};