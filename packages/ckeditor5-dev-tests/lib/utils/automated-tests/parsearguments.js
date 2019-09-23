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
			'reporter',
			'debug'
		],

		boolean: [
			'watch',
			'coverage',
			'source-map',
			'verbose',
			'server',
			'disallow-console-use'
		],

		alias: {
			w: 'watch',
			c: 'coverage',
			s: 'source-map',
			v: 'verbose',
			f: 'files',
			b: 'browsers',
			d: 'debug'
		},

		default: {
			files: [],
			browsers: 'Chrome',
			reporter: 'mocha',
			watch: false,
			coverage: false,
			verbose: false,
			'source-map': false,
			server: false,
			'disallow-console-use': false
		}
	};
	const options = minimist( args, minimistConfig );

	options.disallowConsoleUse = options[ 'disallow-console-use' ];
	options.sourceMap = options[ 'source-map' ];
	options.browsers = options.browsers.split( ',' );

	if ( typeof options.files === 'string' ) {
		options.files = options.files.split( ',' );
	}

	if ( options.debug === 'false' || options.debug === false ) {
		options.debug = [];
	} else if ( typeof options.debug === 'string' ) {
		options.debug = [
			'CK_DEBUG',
			...options.debug.split( ',' ).map( flag => 'CK_DEBUG_' + flag.toUpperCase() )
		];
	} else {
		options.debug = [ 'CK_DEBUG' ];
	}

	options.language = options.language || 'en';
	options.additionalLanguages = options.additionalLanguages ? options.additionalLanguages.split( ',' ) : null;
	options.themePath = options.themePath ? options.themePath : null;

	// Delete all aliases because we don't want to use them in the code.
	// They are useful when calling command but useless after that.
	for ( const alias of Object.keys( minimistConfig.alias ) ) {
		delete options[ alias ];
	}

	// Due to issues with `/` in Git bash (on Windows environments), we needed to introduce an additional CLI parameter.
	// See: https://github.com/ckeditor/ckeditor5-dev/issues/558#issuecomment-534008612
	// `--include-root` appends `/` to the `--files` list.
	// E.g.: `yarn run manual -f core --include-root` => `yarn run manual -f core,/`
	if ( options[ 'include-root' ] && !options.files.includes( '/' ) ) {
		options.files.push( '/' );

		delete options[ 'include-root' ];
	}

	// `--only-root` means that we want to compile manual tests from the main repository only.
	// E.g.: `yarn run manual --include-root` => `yarn run manual -f /`
	if ( options[ 'only-root' ] ) {
		options.files = [ '/' ];

		delete options[ 'only-root' ];
	}

	return options;
};
