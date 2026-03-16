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

vi.mock( 'fs' );
vi.mock( 'mkdirp' );
vi.mock( 'glob' );
vi.mock( 'karma/lib/logger.js' );
vi.mock( '../../lib/utils/automated-tests/getkarmaconfig.js' );
vi.mock( '../../lib/utils/transformfileoptiontotestglob.js' );

describe( 'runAutomatedTests()', () => {
	let runAutomatedTests;

	beforeEach( async () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace' );
		stubs.spawn.call.mockReset();
		vi.mocked( fs ).readFileSync.mockReturnValue( '{}' );

		vi.mocked( karmaLogger ).create.mockImplementation( name => {
			expect( name ).to.equal( 'config' );

			return stubs.log;
		} );

		runAutomatedTests = ( await import( '../../lib/tasks/runautomatedtests.js' ) ).default;
	} );

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
			.rejects.toThrow( 'Karma requires files to tests. `options.files` has to be non-empty array.' );
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
			.rejects.toThrow( 'Not found files to tests. Specified patterns are invalid.' );

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

	it( 'should run only Vitest when package test script uses Vitest', async () => {
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
			scripts: {
				test: 'vitest --run'
			}
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
				'engine'
			],
			{ stdio: 'inherit', cwd: '/workspace', shell: false }
		);
		expect( vi.mocked( fs ).writeFileSync ).not.toHaveBeenCalledWith(
			'/workspace/build/.automated-tests/entry-point.js',
			expect.any( String )
		);
	} );

	it( 'should merge coverage for mixed Karma + Vitest run', async () => {
		const options = {
			files: [ '*' ],
			production: true,
			coverage: true,
			watch: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js',
			'/workspace/packages/ckeditor5-utils/tests/**/*.js'
		] );
		vi.mocked( fs ).readdirSync.mockReturnValue( [] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/model/model.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/first.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/coverage/ChromeHeadless 146.0.0.0 (Mac OS 10.15.7)/lcov.info'
			] );
		vi.mocked( fs ).readFileSync.mockImplementation( path => {
			if ( path.includes( 'ckeditor5-engine/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'vitest run' } } );
			}

			if ( path.includes( 'ckeditor5-utils/package.json' ) ) {
				return JSON.stringify( { scripts: { test: 'karma start' } } );
			}

			if ( path === '/workspace/coverage/ChromeHeadless 146.0.0.0 (Mac OS 10.15.7)/lcov.info' ) {
				return 'TN:karma\nSF:/workspace/packages/ckeditor5-utils/src/index.js\nend_of_record\n';
			}

			if ( path === '/workspace/coverage-vitest/lcov.info' ) {
				return 'TN:vitest\nSF:packages/ckeditor5-engine/src/index.js\nend_of_record\n';
			}

			return '{}';
		} );
		vi.mocked( fs ).existsSync.mockImplementation( path => path === '/workspace/coverage-vitest/lcov.info' );

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
			[
				'vitest',
				'--run',
				'--coverage',
				'--coverage.reportsDirectory',
				'/workspace/coverage-vitest',
				'--project',
				'engine'
			],
			{ stdio: 'inherit', cwd: '/workspace', shell: false }
		);
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledWith(
			'/workspace/coverage/lcov.info',
			expect.stringContaining( 'TN:karma' )
		);
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledWith(
			'/workspace/coverage/lcov.info',
			expect.stringContaining( 'SF:/workspace/packages/ckeditor5-engine/src/index.js' )
		);
	} );

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
			[
				'vitest',
				'--run',
				'--project',
				'utils'
			],
			{ stdio: 'inherit', cwd: '/workspace', shell: false }
		);
	} );
} );
