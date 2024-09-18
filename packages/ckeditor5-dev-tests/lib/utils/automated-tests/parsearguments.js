/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import minimist from 'minimist';
import { tools, logger } from '@ckeditor/ckeditor5-dev-utils';

const require = createRequire( import.meta.url );

/**
 * @param {Array.<String>} args
 * @returns {Object}
 */
export default function parseArguments( args ) {
	const log = logger();

	const minimistConfig = {
		string: [
			'additional-languages',
			'browsers',
			'cwd',
			'debug',
			'files',
			'identity-file',
			'karma-config-overrides',
			'language',
			'reporter',
			'repositories',
			'theme-path',
			'tsconfig'
		],

		boolean: [
			'cache',
			'coverage',
			'dll',
			'notify',
			'production',
			'resolve-js-first',
			'server',
			'silent',
			'source-map',
			'verbose',
			'watch'
		],

		alias: {
			b: 'browsers',
			c: 'coverage',
			d: 'debug',
			f: 'files',
			i: 'identity-file',
			n: 'notify',
			r: 'repositories',
			s: 'source-map',
			v: 'verbose',
			w: 'watch'
		},

		default: {
			'additional-languages': null,
			browsers: 'Chrome',
			cache: false,
			coverage: false,
			cwd: process.cwd(),
			dll: null,
			files: [],
			'identity-file': null,
			language: 'en',
			notify: false,
			production: false,
			reporter: 'mocha',
			repositories: [],
			'resolve-js-first': false,
			server: false,
			silent: false,
			'source-map': true,
			'theme-path': null,
			tsconfig: null,
			verbose: false,
			watch: false
		}
	};

	const options = minimist( args, minimistConfig );

	// Delete all aliases because we don't want to use them in the code.
	// They are useful when calling a command but useless after that.
	for ( const alias of Object.keys( minimistConfig.alias ) ) {
		delete options[ alias ];
	}

	replaceKebabCaseWithCamelCase( options, [
		'source-map',
		'identity-file',
		'theme-path',
		'karma-config-overrides',
		'additional-languages',
		'resolve-js-first'
	] );
	splitOptionsToArray( options, [
		'browsers',
		'files',
		'repositories',
		'additionalLanguages'
	] );
	parseDebugOption( options );
	parseRepositoriesOption( options );
	parseTsconfigPath( options );

	return options;

	/**
	 * Replaces all kebab-case keys in the `options` object with camelCase entries.
	 * Kebab-case keys will be removed.
	 *
	 * @param {Object} options
	 * @param {Array.<String>} keys Kebab-case keys in `options` object.
	 */
	function replaceKebabCaseWithCamelCase( options, keys ) {
		for ( const key of keys ) {
			const camelCaseKey = toCamelCase( key );

			options[ camelCaseKey ] = options[ key ];
			delete options[ key ];
		}
	}

	/**
	 * Parses the `--debug` option.
	 *
	 * @param {Object} options
	 */
	function parseDebugOption( options ) {
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
	}

	/**
	 * Parses the `--repositories` option if specified.
	 *
	 * All packages found in the `packages/` directory inside the root repository or the `external/[repository-name]/packages/` directory
	 * will be added as `options.files`.
	 *
	 * The `ckeditor5-` prefix will be removed.
	 *
	 * @param {Object} options
	 */
	function parseRepositoriesOption( options ) {
		if ( !options.repositories.length ) {
			return;
		}

		const cwd = process.cwd();
		const shouldCheckExternalDirectory = isDirectory( path.join( cwd, 'external' ) );

		if ( !shouldCheckExternalDirectory ) {
			log.warning( 'The `external/` directory does not exist. Only the root repository will be checked.' );
		}

		const files = new Set( options.files );

		for ( const repositoryName of options.repositories ) {
			const cwdPackageJson = require( path.join( cwd, 'package.json' ) );

			// Check the main repository.
			if ( repositoryName === cwdPackageJson.name ) {
				addPackagesToCollection( files, path.join( cwd, 'packages' ) );

				continue;
			}

			// If the `external/` directory does not exist, do not check anything.
			if ( !shouldCheckExternalDirectory ) {
				continue;
			}

			const externalRepositoryPath = path.join( cwd, 'external', repositoryName );

			// Check the "external" directory.
			if ( isDirectory( externalRepositoryPath ) ) {
				addPackagesToCollection( files, path.join( externalRepositoryPath, 'packages' ) );
			} else {
				log.warning( `Did not find the repository "${ repositoryName }" in the root repository or the "external/" directory.` );
			}
		}

		options.files = [ ...files ];

		function addPackagesToCollection( collection, directoryPath ) {
			for ( const directory of tools.getDirectories( directoryPath ) ) {
				collection.add( directory.replace( /^ckeditor5-/, '' ) );
			}
		}
	}

	/**
	 * Parses the `--tsconfig` options to be an absolute path. If argument is not provided,
	 * it will check if `tsconfig.test.json` file exists and use it if it does.
	 *
	 * @param {Object} options
	 */
	function parseTsconfigPath( options ) {
		if ( options.tsconfig ) {
			options.tsconfig = path.join( options.cwd, options.tsconfig );
		} else {
			options.tsconfig = path.join( options.cwd, 'tsconfig.test.json' );
		}

		if ( !fs.existsSync( options.tsconfig ) ) {
			options.tsconfig = null;
		}
	}

	/**
	 * Splits by a comma (`,`) all values specified under keys to array.
	 *
	 * @param {Object} options
	 * @param {Array.<String>} keys Kebab-case keys in `options` object.
	 */
	function splitOptionsToArray( options, keys ) {
		for ( const key of keys ) {
			if ( typeof options[ key ] === 'string' ) {
				options[ key ] = options[ key ].split( ',' );
			}
		}
	}

	/**
	 * Returns a camel case value for specified kebab-case `value`.
	 *
	 * @param {String} value Kebab-case string.
	 * @returns {String}
	 */
	function toCamelCase( value ) {
		return value.split( '-' )
			.map( ( item, index ) => {
				if ( index == 0 ) {
					return item.toLowerCase();
				}

				return item.charAt( 0 ).toUpperCase() + item.slice( 1 ).toLowerCase();
			} )
			.join( '' );
	}

	/**
	 * @param {String} path
	 * @returns {Boolean}
	 */
	function isDirectory( path ) {
		try {
			return fs.statSync( path ).isDirectory();
		} catch ( e ) {
			return false;
		}
	}
}
