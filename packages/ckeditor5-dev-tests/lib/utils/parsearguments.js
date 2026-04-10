/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'upath';
import { styleText } from 'node:util';
import minimist from 'minimist';
import { tools, logger } from '@ckeditor/ckeditor5-dev-utils';

/**
 * @param {Array.<string>} args
 * @param {object} settings
 * @param {boolean} [settings.allowDefaultIdentityFile]
 * @param {string} [settings.commandName] CLI command name displayed in the `--help` usage line.
 * If the name contains 'manual', manual-specific help is shown.
 * @returns {object}
 */
export default function parseArguments( args, settings = {} ) {
	const log = logger();
	const unknownArgs = [];

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
			'port',
			'reporter',
			'repositories',
			'tsconfig'
		],

		boolean: [
			'cache',
			'coverage',
			'disable-watch',
			'help',
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
			h: 'help',
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
			'disable-watch': false,
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
			tsconfig: null,
			verbose: false,
			watch: false
		},

		unknown: arg => {
			unknownArgs.push( arg );

			return false;
		}
	};

	const options = minimist( args, minimistConfig );

	if ( options.help ) {
		printHelp( settings );
		process.exit( 0 );
	}

	if ( settings.commandName ) {
		unknownArgs.push( ...getUnsupportedOptions( settings.commandName, args ) );
	}

	if ( unknownArgs.length ) {
		const uniqueArgs = [ ...new Set( unknownArgs ) ];

		console.error( `Unknown option${ uniqueArgs.length > 1 ? 's' : '' }: ${ uniqueArgs.join( ', ' ) }` );
		console.error( 'Run this script with the "--help" option to see all available options.' );
		process.exit( 1 );
	}

	// Delete all aliases because we don't want to use them in the code.
	// They are useful when calling a command but useless after that.
	for ( const alias of Object.keys( minimistConfig.alias ) ) {
		delete options[ alias ];
	}

	replaceKebabCaseWithCamelCase( options, [
		'disable-watch',
		'source-map',
		'identity-file',
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

	if ( options.port ) {
		options.port = parseInt( options.port, 10 );
	}

	parseDebugOption( options );
	parseRepositoriesOption( options );
	parseTsconfigPath( options );
	useDefaultIdentityFile( options );

	return options;

	/**
	 * Replaces all kebab-case keys in the `options` object with camelCase entries.
	 * Kebab-case keys will be removed.
	 *
	 * @param {object} options
	 * @param {Array.<string>} keys Kebab-case keys in `options` object.
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
	 * @param {object} options
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
	 * @param {object} options
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
			const cwdPackageJson = fs.readFileSync( path.join( cwd, 'package.json' ) );
			const { name } = JSON.parse( cwdPackageJson );

			// Check the main repository.
			if ( repositoryName === name ) {
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
	 * @param {object} options
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
	 * @param {object} options
	 * @param {Array.<string>} keys Kebab-case keys in `options` object.
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
	 * @param {string} value Kebab-case string.
	 * @returns {string}
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
	 * @param {string} path
	 * @returns {boolean}
	 */
	function isDirectory( path ) {
		try {
			return fs.statSync( path ).isDirectory();
		} catch {
			return false;
		}
	}

	/**
	 * Checks that no options exclusive to the other command type were used.
	 * For example, `--coverage` is only valid for automated tests, so passing it
	 * to the manual-test command is an error.
	 *
	 * The set of allowed options is derived from the help-text option groups so
	 * that the two stay in sync automatically.
	 *
	 * @param {string} commandName
	 * @param {Array.<string>} rawArgs
	 * @returns {Array.<string>}
	 */
	function getUnsupportedOptions( commandName, rawArgs ) {
		const isManual = commandName.includes( 'manual' );
		const allowedGroups = isManual ? getManualOptionGroups() : getAutomatedOptionGroups();

		const allowedNames = new Set();

		for ( const group of allowedGroups ) {
			for ( const option of group.options ) {
				allowedNames.add( `--${ option.name }` );

				if ( option.alias ) {
					allowedNames.add( `-${ option.alias }` );
				}
			}
		}

		const unsupportedArgs = [];

		for ( const arg of rawArgs ) {
			if ( arg.startsWith( '--' ) ) {
				const flag = arg.split( '=' )[ 0 ];

				if ( !allowedNames.has( flag ) ) {
					unsupportedArgs.push( flag );
				}
			} else if ( arg.startsWith( '-' ) ) {
				for ( const letter of arg.slice( 1 ) ) {
					const flag = `-${ letter }`;

					if ( minimistConfig.alias[ letter ] && !allowedNames.has( flag ) ) {
						unsupportedArgs.push( flag );
					}
				}
			}
		}

		return unsupportedArgs;
	}

	/**
	 * Prints help text for the CLI command.
	 *
	 * @param {object} settings
	 */
	function printHelp( settings ) {
		const commandName = settings.commandName || 'ckeditor5-dev-tests';
		const isManual = commandName.includes( 'manual' );

		const description = isManual ?
			'Compiles and serves manual tests with a live-reloading dev server.' :
			'Runs automated tests using Karma and Vitest.';

		const optionGroups = isManual ? getManualOptionGroups() : getAutomatedOptionGroups();
		const examples = isManual ? getManualExamples( commandName ) : getAutomatedExamples( commandName );

		const lines = [
			'',
			styleText( 'bold', `  ${ commandName }` ) + ' [options]',
			'',
			`  ${ description }`,
			''
		];

		for ( const group of optionGroups ) {
			lines.push( styleText( 'bold', styleText( 'underline', group.title ) ) );
			lines.push( '' );

			for ( const option of group.options ) {
				const aliasCol = option.alias ? styleText( 'yellow', `-${ option.alias }` ) + ',' : '   ';
				const nameCol = styleText( 'yellow', `--${ option.name }` ) +
					( option.hint ? ' ' + styleText( 'dim', `<${ option.hint }>` ) : '' );
				const padding = Math.max( 1, 36 - option.name.length - ( option.hint ? option.hint.length + 3 : 0 ) );
				const defaultVal = option.default ? '  ' + styleText( 'dim', `[default: ${ option.default }]` ) : '';

				lines.push( `  ${ aliasCol } ${ nameCol }${ ' '.repeat( padding ) }${ option.description }${ defaultVal }` );
			}

			lines.push( '' );
		}

		lines.push( styleText( 'bold', styleText( 'underline', 'Examples' ) ) );
		lines.push( '' );

		for ( const example of examples ) {
			lines.push( `  ${ styleText( 'dim', '#' ) } ${ example.description }` );
			lines.push( `  ${ styleText( 'cyan', example.command ) }` );
			lines.push( '' );
		}

		console.log( lines.join( '\n' ) );
	}

	/**
	 * @returns {Array.<Object>}
	 */
	function getAutomatedOptionGroups() {
		return [
			{
				title: 'Test selection',
				options: [
					{
						alias: 'f', name: 'files', hint: 'pattern',
						description: 'Package names, directories, or files to test (comma-separated)',
						default: '*'
					},
					{
						alias: 'r', name: 'repositories', hint: 'names',
						description: 'Repository names whose packages should be tested (comma-separated)'
					},
					{
						alias: 'b', name: 'browsers', hint: 'names',
						description: 'Browsers for running tests (comma-separated)',
						default: 'Chrome'
					}
				]
			},
			{
				title: 'Test execution',
				options: [
					{ alias: 'c', name: 'coverage', description: 'Generate code coverage report' },
					{ alias: 'w', name: 'watch', description: 'Watch files and re-run tests on changes' },
					{
						alias: 'd', name: 'debug', hint: 'flags',
						description: 'Debug flags (e.g. --debug engine,ui). Use --no-debug to disable',
						default: 'CK_DEBUG'
					},
					{ name: 'production', description: 'Run strictest checks (fail on console calls, DOM leaks)' },
					{ name: 'server', description: 'Run Karma server without opening a browser' },
					{ name: 'reporter', hint: 'type', description: 'Mocha reporter: "mocha" or "dots"', default: 'mocha' }
				]
			},
			{
				title: 'Build configuration',
				options: [
					{ alias: 's', name: 'source-map', description: 'Generate source maps', default: 'true' },
					{ name: 'language', hint: 'code', description: 'Language for building tests', default: 'en' },
					{ name: 'additional-languages', hint: 'codes', description: 'Additional languages for translations (comma-separated)' },
					{ name: 'cache', description: 'Use Webpack filesystem cache' },
					{ name: 'resolve-js-first', description: 'Resolve .js files before .ts files' },
					{ name: 'tsconfig', hint: 'path', description: 'Path to TypeScript configuration file' },
					{ name: 'karma-config-overrides', hint: 'path', description: 'Path to Karma config overrides file' },
					{ alias: 'i', name: 'identity-file', hint: 'path', description: 'File providing secret keys for test scripts' }
				]
			},
			{
				title: 'Output',
				options: [
					{ alias: 'v', name: 'verbose', description: 'Show Webpack processing details' },
					{ alias: 'n', name: 'notify', description: 'Enable desktop notifications on test completion' },
					{ name: 'silent', description: 'Hide processed files info' }
				]
			},
			{
				title: 'Other',
				options: [
					{ name: 'cwd', hint: 'path', description: 'Set current working directory' },
					{ alias: 'h', name: 'help', description: 'Show this help message' }
				]
			}
		];
	}

	/**
	 * @returns {Array.<Object>}
	 */
	function getManualOptionGroups() {
		return [
			{
				title: 'Test selection',
				options: [
					{
						alias: 'f', name: 'files', hint: 'pattern',
						description: 'Package names, directories, or files to test (comma-separated)'
					},
					{
						alias: 'r', name: 'repositories', hint: 'names',
						description: 'Repository names whose packages should be tested (comma-separated)'
					}
				]
			},
			{
				title: 'Server',
				options: [
					{
						name: 'port', hint: 'number',
						description: 'Port for the manual test server',
						default: '8125'
					},
					{ name: 'disable-watch', description: 'Disable automatic rebuilding on file changes' }
				]
			},
			{
				title: 'Build configuration',
				options: [
					{
						alias: 'd', name: 'debug', hint: 'flags',
						description: 'Debug flags (e.g. --debug engine,ui). Use --no-debug to disable',
						default: 'CK_DEBUG'
					},
					{ alias: 's', name: 'source-map', description: 'Generate source maps', default: 'true' },
					{ name: 'language', hint: 'code', description: 'Language for building tests', default: 'en' },
					{ name: 'additional-languages', hint: 'codes', description: 'Additional languages for translations (comma-separated)' },
					{ name: 'production', description: 'Run strictest checks' },
					{ name: 'tsconfig', hint: 'path', description: 'Path to TypeScript configuration file' },
					{ alias: 'i', name: 'identity-file', hint: 'path', description: 'File providing secret keys for test scripts' }
				]
			},
			{
				title: 'Output',
				options: [
					{ alias: 'v', name: 'verbose', description: 'Show Webpack processing details' },
					{ alias: 'n', name: 'notify', description: 'Enable desktop notifications' },
					{ name: 'silent', description: 'Hide processed files info' }
				]
			},
			{
				title: 'Other',
				options: [
					{ name: 'cwd', hint: 'path', description: 'Set current working directory' },
					{ alias: 'h', name: 'help', description: 'Show this help message' }
				]
			}
		];
	}

	/**
	 * @param {string} commandName
	 * @returns {Array.<Object>}
	 */
	function getAutomatedExamples( commandName ) {
		return [
			{ description: 'Test specific packages with coverage', command: `${ commandName } -c --files=enter,paragraph` },
			{ description: 'Watch mode for engine view tests', command: `${ commandName } -w --files=engine/view/` },
			{ description: 'Test on multiple browsers', command: `${ commandName } --browsers=Chrome,Firefox --files=basic-styles/bold` },
			{ description: 'Test all packages', command: `${ commandName } --files=*` }
		];
	}

	/**
	 * @param {string} commandName
	 * @returns {Array.<Object>}
	 */
	function getManualExamples( commandName ) {
		return [
			{ description: 'Serve manual tests for a specific package', command: `${ commandName } --files=image` },
			{ description: 'Serve all manual tests without watch', command: `${ commandName } --disable-watch` }
		];
	}

	/**
	 * @param {object} options
	 */
	function useDefaultIdentityFile( options ) {
		if ( !settings.allowDefaultIdentityFile ) {
			return;
		}

		// This option has three possible states:
		// null - meaning that `--identity-file` was not passed, and default value should be injected.
		// false - meaning that `--no-identity-file` was passed, and default value should not be injected.
		// string - meaning that `--identity-file` was passed, and default value should not be injected.
		if ( options.identityFile !== null ) {
			return;
		}

		const defaultFilePath = path.join( options.cwd, 'scripts', 'presets', 'staging-ff.js' );

		if ( !fs.existsSync( defaultFilePath ) ) {
			return;
		}

		options.identityFile = defaultFilePath;
	}
}
