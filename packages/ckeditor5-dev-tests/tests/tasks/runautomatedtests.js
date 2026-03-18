/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { styleText } from 'node:util';
import { globSync } from 'glob';
import { mkdirp } from 'mkdirp';
import karma from 'karma';
import karmaLogger from 'karma/lib/logger.js';
import transformFileOptionToTestGlob from '../../lib/utils/transformfileoptiontotestglob.js';
import upath from 'upath';

const stubs = vi.hoisted( () => ( {
	log: {
		log: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn()
	},
	karma: {
		server: {
			constructor: vi.fn(),
			on: vi.fn(),
			start: vi.fn()
		}
	},
	spawn: {
		call: vi.fn()
	},
	devUtilsLogger: {
		info: vi.fn(),
		warning: vi.fn(),
		error: vi.fn()
	}
} ) );

vi.mock( 'node:child_process', () => ( {
	spawn: vi.fn( ( ...args ) => {
		stubs.spawn.call( ...args );

		const callbacks = {};

		return {
			on: ( eventName, callback ) => {
				callbacks[ eventName ] = callback;
			},
			emit: ( eventName, ...eventArgs ) => {
				if ( callbacks[ eventName ] ) {
					callbacks[ eventName ]( ...eventArgs );
				}
			}
		};
	} )
} ) );

vi.mock( 'karma', () => ( {
	default: {
		Server: class KarmaServer {
			constructor( ...args ) {
				stubs.karma.server.constructor( ...args );
			}

			on( ...args ) {
				return stubs.karma.server.on( ...args );
			}

			start( ...args ) {
				return stubs.karma.server.start( ...args );
			}
		},
		config: {
			parseConfig: vi.fn()
		}
	}
} ) );

vi.mock( 'node:util', () => ( {
	styleText: vi.fn( ( _style, text ) => text )
} ) );

vi.mock( 'node:fs' );
vi.mock( 'mkdirp' );
vi.mock( 'glob' );
vi.mock( 'karma/lib/logger.js' );
vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	logger: vi.fn( () => stubs.devUtilsLogger )
} ) );
vi.mock( '../../lib/utils/automated-tests/getkarmaconfig.js' );
vi.mock( '../../lib/utils/transformfileoptiontotestglob.js' );

describe( 'runAutomatedTests()', () => {
	let runAutomatedTests;

	beforeEach( async () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace' );
		stubs.spawn.call.mockReset();

		// Default: return empty JSON for package.json reads (no scripts → Karma runner).
		vi.mocked( fs ).readFileSync.mockReturnValue( '{}' );

		vi.mocked( karmaLogger ).create.mockImplementation( name => {
			expect( name ).to.equal( 'config' );

			return stubs.log;
		} );

		runAutomatedTests = ( await import( '../../lib/tasks/runautomatedtests.js' ) ).default;
	} );

	// -- Karma-only tests -------------------------------------------------------------------------

	it( 'should create an entry file before tests execution', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		const expectedEntryPointContent = [
			'import "/workspace/packages/ckeditor5-basic-styles/tests/bold.js";',
			'import "/workspace/packages/ckeditor5-basic-styles/tests/italic.js";'
		].join( '\n' );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( vi.mocked( mkdirp ).sync ).toHaveBeenCalledExactlyOnceWith( '/workspace/build/.automated-tests' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			'/workspace/build/.automated-tests/entry-point.js',
			expect.stringContaining( expectedEntryPointContent )
		);
	} );

	it( 'throws when files are not specified', async () => {
		await expect( runAutomatedTests( { production: true } ) )
			.rejects.toThrow( 'Test runner requires files to test. `options.files` has to be a non-empty array.' );
	} );

	it( 'throws when specified files are invalid', async () => {
		const options = {
			files: [
				'basic-foo',
				'bar-core'
			],
			production: true
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [] );

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-foo/tests/**/*.js',
				'/workspace/packages/ckeditor-basic-foo/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-bar-core/tests/**/*.js',
				'/workspace/packages/ckeditor-bar-core/tests/**/*.js'
			] );

		vi.mocked( globSync ).mockReturnValue( [] );

		await expect( runAutomatedTests( options ) )
			.rejects.toThrow( 'No test files found. Specified patterns are invalid.' );

		expect( stubs.log.warn ).toHaveBeenCalledTimes( 2 );
		expect( stubs.log.warn ).toHaveBeenCalledWith( 'Pattern "%s" does not match any file.', 'basic-foo' );
		expect( stubs.log.warn ).toHaveBeenCalledWith( 'Pattern "%s" does not match any file.', 'bar-core' );
	} );

	it( 'throws when Karma config parser throws', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [] );

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-foo/tests/**/*.js',
				'/workspace/packages/ckeditor-basic-foo/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-bar-core/tests/**/*.js',
				'/workspace/packages/ckeditor-bar-core/tests/**/*.js'
			] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		vi.mocked( karma ).config.parseConfig.mockImplementation( () => {
			throw new Error( 'Example error from Karma config parser.' );
		} );

		await expect( runAutomatedTests( options ) )
			.rejects.toThrow( 'Example error from Karma config parser.' );
	} );

	it( 'should warn when the `production` option is set to `false`', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: false
		};

		const consoleWarnStub = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );

		vi.mocked( styleText ).mockReturnValue( 'chalk.yellow: warn' );
		vi.mocked( fs ).readdirSync.mockReturnValue( [] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( consoleWarnStub ).toHaveBeenCalledExactlyOnceWith( 'chalk.yellow: warn' );
		expect( vi.mocked( styleText ) ).toHaveBeenCalledExactlyOnceWith(
			'yellow',
			'⚠ You\'re running tests in dev mode - some error protections are loose. ' +
			'Use the `--production` flag to use strictest verification methods.'
		);
	} );

	it( 'should not add the code making console use throw an error when the `production` option is set to false', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: false
		};

		vi.spyOn( console, 'warn' ).mockImplementation( () => {
		} );
		vi.mocked( fs ).readdirSync.mockReturnValue( [] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			expect.any( String ),
			expect.not.stringContaining( '// Make using any method from the console to fail.' )
		);
	} );

	it( 'should add the code making console use throw an error when the `production` option is set to true', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		vi.spyOn( console, 'warn' ).mockImplementation( () => {
		} );
		vi.mocked( fs ).readdirSync.mockReturnValue( [] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			expect.any( String ),
			expect.stringContaining( '// Make using any method from the console to fail.' )
		);
	} );

	it( 'should load custom assertions automatically (camelCase in paths)', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [ 'assertionA.js', 'assertionB.js' ] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		const assertionsDir = upath.join( import.meta.dirname, '..', '..', 'lib', 'utils', 'automated-tests', 'assertions' );

		const expectedEntryPointContent = [
			`import assertionAFactory from "${ assertionsDir }/assertionA.js";`,
			`import assertionBFactory from "${ assertionsDir }/assertionB.js";`,
			'assertionAFactory( chai );',
			'assertionBFactory( chai );'
		].join( '\n' );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( vi.mocked( mkdirp ).sync ).toHaveBeenCalledExactlyOnceWith( '/workspace/build/.automated-tests' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			'/workspace/build/.automated-tests/entry-point.js',
			expect.stringContaining( expectedEntryPointContent )
		);
	} );

	it( 'should load custom assertions automatically (kebab-case in paths)', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [ 'assertion-a.js', 'assertion-b.js' ] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-basic-styles/tests/**/*.js',
			'/workspace/packages/ckeditor-basic-styles/tests/**/*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold.js',
				'/workspace/packages/ckeditor5-basic-styles/tests/italic.js'
			] );

		const assertionsDir = upath.join( import.meta.dirname, '..', '..', 'lib', 'utils', 'automated-tests', 'assertions' );

		const expectedEntryPointContent = [
			`import assertionAFactory from "${ assertionsDir }/assertion-a.js";`,
			`import assertionBFactory from "${ assertionsDir }/assertion-b.js";`,
			'assertionAFactory( chai );',
			'assertionBFactory( chai );',
			''
		].join( '\n' );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( vi.mocked( mkdirp ).sync ).toHaveBeenCalledExactlyOnceWith( '/workspace/build/.automated-tests' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			'/workspace/build/.automated-tests/entry-point.js',
			expect.stringContaining( expectedEntryPointContent )
		);
	} );

	it( 'should load custom assertions automatically (Windows paths)', async () => {
		const options = {
			files: [
				'basic-styles'
			],
			production: true
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [ 'assertion-a.js', 'assertion-b.js' ] );

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'\\workspace\\packages\\ckeditor5-basic-styles\\tests\\**\\*.js',
			'\\workspace\\packages\\ckeditor-basic-styles\\tests\\**\\*.js'
		] );

		vi.mocked( globSync )
			.mockReturnValue( [] )
			.mockReturnValueOnce( [
				'\\workspace\\packages\\ckeditor5-basic-styles\\tests\\bold.js',
				'\\workspace\\packages\\ckeditor5-basic-styles\\tests\\italic.js'
			] );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();

			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );
		} );

		await promise;

		expect( vi.mocked( mkdirp ).sync ).toHaveBeenCalledExactlyOnceWith( '/workspace/build/.automated-tests' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			'/workspace/build/.automated-tests/entry-point.js',
			expect.stringContaining( [
				'import "/workspace/packages/ckeditor5-basic-styles/tests/bold.js";',
				'import "/workspace/packages/ckeditor5-basic-styles/tests/italic.js";'
			].join( '\n' ) )
		);
	} );

	// -- Vitest-only tests ------------------------------------------------------------------------

	it( 'should run only Vitest when all selected packages use Vitest', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 0 );

		await promise;

		expect( stubs.karma.server.constructor ).not.toHaveBeenCalled();
		expect( stubs.spawn.call ).toHaveBeenCalledExactlyOnceWith(
			'pnpm',
			[
				'vitest',
				'--run',
				'--project',
				'engine',
				'packages/ckeditor5-engine/tests/model/model.js'
			],
			{ stdio: 'inherit', cwd: '/workspace', shell: process.platform === 'win32' }
		);
		expect( vi.mocked( fs ).writeFileSync ).not.toHaveBeenCalledWith(
			'/workspace/build/.automated-tests/entry-point.js',
			expect.any( String )
		);
	} );

	it( 'should pass --watch flag to Vitest when watch mode is enabled', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: true,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 0 );

		await promise;

		expect( stubs.spawn.call ).toHaveBeenCalledExactlyOnceWith(
			'pnpm',
			[
				'vitest',
				'--watch',
				'--project',
				'engine',
				'packages/ckeditor5-engine/tests/model/model.js'
			],
			expect.any( Object )
		);
	} );

	it( 'should pass coverage flags to Vitest and merge coverage with nyc', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );
		vi.mocked( fs ).existsSync.mockReturnValue( true );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		// First spawn: vitest project run.
		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		// Second spawn: nyc report merge.
		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 0 );

		await promise;

		// Vitest was called with per-project coverage directory.
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			1,
			'pnpm',
			[
				'vitest',
				'--run',
				'--coverage',
				'--coverage.reportsDirectory',
				'/workspace/coverage-vitest/engine',
				'--project',
				'engine',
				'packages/ckeditor5-engine/tests/model/model.js'
			],
			expect.any( Object )
		);

		// coverage-final.json was copied into .nyc_output.
		expect( vi.mocked( fs ).existsSync ).toHaveBeenCalledWith(
			'/workspace/coverage-vitest/engine/coverage-final.json'
		);
		expect( vi.mocked( fs ).copyFileSync ).toHaveBeenCalledWith(
			'/workspace/coverage-vitest/engine/coverage-final.json',
			'/workspace/coverage-vitest/.nyc_output/engine.json'
		);

		// nyc report was called with correct reporters.
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			2,
			'pnpx',
			[
				'nyc', 'report',
				'--temp-dir', '/workspace/coverage-vitest/.nyc_output',
				'--report-dir', '/workspace/coverage-vitest',
				'--reporter', 'html',
				'--reporter', 'json',
				'--reporter', 'lcovonly',
				'--reporter', 'text-summary'
			],
			expect.objectContaining( { stdio: 'inherit', cwd: '/workspace' } )
		);

		// Log message was printed.
		expect( stubs.devUtilsLogger.info ).toHaveBeenCalled();
	} );

	it( 'should reject when Vitest process exits with non-zero code', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 1 );

		await expect( promise ).rejects.toThrow( 'Vitest finished with "1" code.' );
	} );

	// -- Mixed Karma + Vitest tests ---------------------------------------------------------------

	it( 'should route mixed package selection to Karma and Vitest', async () => {
		const options = {
			files: [ 'utils', 'emoji' ],
			production: true,
			coverage: false,
			watch: false
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [] );
		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-utils/tests/**/*.js' ] )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-emoji/tests/**/*.js' ] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-emoji/tests/emoji.js' ] );
		vi.mocked( fs ).readFileSync.mockImplementation( path => {
			if ( path.includes( 'ckeditor5-utils/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			if ( path.includes( 'ckeditor5-emoji/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'karma start' } } );
			}

			return '{}';
		} );

		const promise = runAutomatedTests( options );

		setTimeout( () => {
			const [ firstCall ] = stubs.karma.server.constructor.mock.calls;
			const [ , exitCallback ] = firstCall;

			exitCallback( 0 );

			setTimeout( () => {
				const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );

				subprocess.emit( 'close', 0 );
			} );
		} );

		await promise;

		expect( stubs.karma.server.constructor ).toHaveBeenCalledOnce();
		expect( stubs.spawn.call ).toHaveBeenCalledExactlyOnceWith(
			'pnpm',
			[ 'vitest', '--run', '--project', 'utils', 'packages/ckeditor5-utils/tests/first.js' ],
			{ stdio: 'inherit', cwd: '/workspace', shell: process.platform === 'win32' }
		);
	} );

	it( 'should throw when watch mode is used with mixed Karma + Vitest packages', async () => {
		const options = {
			files: [ 'utils', 'emoji' ],
			production: true,
			coverage: false,
			watch: true
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-utils/tests/**/*.js' ] )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-emoji/tests/**/*.js' ] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-emoji/tests/emoji.js' ] );
		vi.mocked( fs ).readFileSync.mockImplementation( path => {
			if ( path.includes( 'ckeditor5-utils/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			if ( path.includes( 'ckeditor5-emoji/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'karma start' } } );
			}

			return '{}';
		} );

		await expect( runAutomatedTests( options ) ).rejects.toThrow(
			'Watch mode cannot be used in a mixed Karma + Vitest run. ' +
			'Run watch mode separately for Karma and Vitest packages.'
		);
	} );

	it( 'should aggregate errors when both runners fail', async () => {
		const options = {
			files: [ 'utils', 'emoji' ],
			production: true,
			coverage: false,
			watch: false
		};

		vi.mocked( fs ).readdirSync.mockReturnValue( [] );
		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-utils/tests/**/*.js' ] )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-emoji/tests/**/*.js' ] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [ '/workspace/packages/ckeditor5-emoji/tests/emoji.js' ] );
		vi.mocked( fs ).readFileSync.mockImplementation( path => {
			if ( path.includes( 'ckeditor5-utils/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			if ( path.includes( 'ckeditor5-emoji/package.json' ) ) {
				return JSON.stringify( { scripts: {} } );
			}

			return '{}';
		} );

		vi.mocked( karma ).config.parseConfig.mockImplementation( () => {
			throw new Error( 'Karma finished with "1" code.' );
		} );

		const promise = runAutomatedTests( options );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 2 );

		await expect( promise ).rejects.toThrow( /Test execution failed in multiple runners/ );
	} );

	// -- Multiple Vitest projects test ------------------------------------------------------------

	it( 'should run each Vitest project in a separate process with selected files', async () => {
		const options = {
			files: [ 'utils', 'engine' ],
			production: true,
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/**/*.js'
			] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/model.js' ] );
		vi.mocked( fs ).readFileSync.mockImplementation( path => {
			if ( path.includes( 'ckeditor5-utils/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			if ( path.includes( 'ckeditor5-engine/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			return '{}';
		} );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ firstSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		firstSubprocess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );
		const [ , secondSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		secondSubprocess.emit( 'close', 0 );

		await promise;

		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			1,
			'pnpm',
			[
				'vitest',
				'--run',
				'--project',
				'utils',
				'external/ckeditor5/packages/ckeditor5-utils/tests/first.js'
			],
			{ stdio: 'inherit', cwd: '/workspace', shell: process.platform === 'win32' }
		);
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			2,
			'pnpm',
			[
				'vitest',
				'--run',
				'--project',
				'engine',
				'external/ckeditor5/packages/ckeditor5-engine/tests/model.js'
			],
			{ stdio: 'inherit', cwd: '/workspace', shell: process.platform === 'win32' }
		);
	} );

	it( 'should throw when watch mode is used with multiple Vitest projects', async () => {
		const options = {
			files: [ 'utils', 'engine' ],
			production: true,
			watch: true,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/**/*.js'
			] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/model.js' ] );
		vi.mocked( fs ).readFileSync.mockImplementation( path => {
			if ( path.includes( 'ckeditor5-utils/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			if ( path.includes( 'ckeditor5-engine/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			return '{}';
		} );

		await expect( runAutomatedTests( options ) ).rejects.toThrow(
			'Watch mode cannot be used for multiple Vitest projects in one run. ' +
			'Run watch mode separately for each Vitest project.'
		);

		expect( stubs.spawn.call ).not.toHaveBeenCalled();
	} );

	// -- Edge cases -------------------------------------------------------------------------------

	it( 'should resolve when Vitest exits with code 130 (SIGINT)', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 130 );

		await promise;
	} );

	it( 'should reject when spawn emits an error event', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'error', new Error( 'spawn ENOENT' ) );

		await expect( promise ).rejects.toThrow( 'spawn ENOENT' );
	} );

	it( 'should skip copying coverage-final.json when the file does not exist', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 0 );

		await promise;

		expect( vi.mocked( fs ).copyFileSync ).not.toHaveBeenCalled();
	} );

	it( 'should reject when nyc report fails', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 1 );

		await expect( promise ).rejects.toThrow( 'nyc report finished with "1" code.' );
	} );

	it( 'should reject when nyc spawn emits an error', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
			scripts: { test: 'vitest --run' }
		} ) );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'error', new Error( 'nyc ENOENT' ) );

		await expect( promise ).rejects.toThrow( 'nyc ENOENT' );
	} );

	it( 'should throw when a test file path does not contain /tests/ segment', async () => {
		const options = {
			files: [ 'engine' ],
			production: true,
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/src/model.js'
		] );

		await expect( runAutomatedTests( options ) ).rejects.toThrow(
			'Cannot determine package root for "/workspace/packages/ckeditor5-engine/src/model.js".'
		);
	} );
} );
