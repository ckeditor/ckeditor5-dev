/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import { globSync } from 'glob';
import chalk from 'chalk';
import inquirer from 'inquirer';
import isInteractive from 'is-interactive';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import requireDll from '../../lib/utils/requiredll.js';
import createManualTestServer from '../../lib/utils/manual-tests/createserver.js';
import compileManualTestScripts from '../../lib/utils/manual-tests/compilescripts.js';
import compileManualTestHtmlFiles from '../../lib/utils/manual-tests/compilehtmlfiles.js';
import transformFileOptionToTestGlob from '../../lib/utils/transformfileoptiontotestglob.js';
import removeDir from '../../lib/utils/manual-tests/removedir.js';
import runManualTests from '../../lib/tasks/runmanualtests.js';

const stubs = vi.hoisted( () => ( {
	log: {
		log: vi.fn(),
		error: vi.fn(),
		warning: vi.fn(),
		info: vi.fn()
	},
	spawn: {
		spawnReturnValue: {
			on: ( event, callback ) => {
				if ( !stubs.spawn.spawnEvents[ event ] ) {
					stubs.spawn.spawnEvents[ event ] = [];
				}

				stubs.spawn.spawnEvents[ event ].push( callback );

				// Return the same object containing the `on()` method to allow method chaining: `.on( ... ).on( ... )`.
				return stubs.spawn.spawnReturnValue;
			}
		},
		spawnExitCode: 0,
		spawnEvents: {},
		spawnTriggerEvent: ( event, data ) => {
			if ( stubs.spawn.spawnEvents[ event ] ) {
				for ( const callback of stubs.spawn.spawnEvents[ event ] ) {
					callback( data );
				}

				delete stubs.spawn.spawnEvents[ event ];
			}
		}
	}
} ) );

vi.mock( 'socket.io' );
vi.mock( 'child_process' );
vi.mock( 'inquirer' );
vi.mock( 'glob' );
vi.mock( 'chalk', () => ( {
	default: {
		bold: vi.fn( input => input )
	}
} ) );
vi.mock( 'path' );
vi.mock( 'fs' );
vi.mock( 'is-interactive' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../lib/utils/manual-tests/createserver.js' );
vi.mock( '../../lib/utils/manual-tests/compilehtmlfiles.js' );
vi.mock( '../../lib/utils/manual-tests/compilescripts.js' );
vi.mock( '../../lib/utils/manual-tests/removedir.js' );
vi.mock( '../../lib/utils/manual-tests/copyassets.js' );
vi.mock( '../../lib/utils/transformfileoptiontotestglob.js' );
vi.mock( '../../lib/utils/requiredll.js' );

describe( 'runManualTests()', () => {
	let defaultOptions;

	beforeEach( () => {
		stubs.spawn.spawnExitCode = 0;

		vi.mocked( spawn ).mockImplementation( () => {
			// Simulate closing a new process. It does not matter that this simulation ends the child process immediately.
			// All that matters is that the `close` event is emitted with specified exit code.
			process.nextTick( () => {
				stubs.spawn.spawnTriggerEvent( 'close', stubs.spawn.spawnExitCode );
			} );

			return stubs.spawn.spawnReturnValue;
		} );

		vi.mocked( globSync ).mockImplementation( pattern => {
			const patterns = {
				// Valid pattern for manual tests.
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js': [
					'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
					'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js'
				],
				// Another valid pattern for manual tests.
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js': [
					'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
					'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
				],
				// Invalid pattern for manual tests (points to `/_utils/` subdirectory).
				'workspace/packages/ckeditor-*/tests/**/manual/_utils/**/*.js': [
					'workspace/packages/ckeditor-foo/tests/manual/_utils/feature-e.js',
					'workspace/packages/ckeditor-bar/tests/manual/_utils/feature-f.js'
				],
				// Invalid pattern for manual tests (points outside manual test directory).
				'workspace/packages/ckeditor-*/tests/**/outside/**/*.js': [
					'workspace/packages/ckeditor-foo/tests/outside/feature-g.js',
					'workspace/packages/ckeditor-bar/tests/outside/feature-h.js'
				],
				// Valid pattern for manual tests that require DLLs.
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js': [
					'workspace/packages/ckeditor5-foo/tests/manual/dll/feature-i-dll.js',
					'workspace/packages/ckeditor5-bar/tests/manual/dll/feature-j-dll.js'
				],
				// Pattern for finding `package.json` in all repositories.
				// External repositories are first, then the root repository.
				'{,external/*/}package.json': [
					'workspace/ckeditor5-commercial/external/ckeditor5/package.json',
					'workspace/ckeditor5-commercial/package.json'
				]
			};

			const separator = process.platform === 'win32' ? '\\' : '/';
			const result = patterns[ pattern ] || [];

			return result.map( p => p.split( '/' ).join( separator ) );
		} );

		vi.mocked( path ).join.mockImplementation( ( ...chunks ) => chunks.join( '/' ) );
		vi.mocked( path ).resolve.mockImplementation( path => '/absolute/path/to/' + path );
		vi.mocked( path ).basename.mockImplementation( path => path.split( /[\\/]/ ).pop() );
		vi.mocked( path ).dirname.mockImplementation( path => {
			const chunks = path.split( /[\\/]/ );

			chunks.pop();

			return chunks.join( '/' );
		} );

		vi.mocked( logger ).mockImplementation( () => stubs.log );
		vi.mocked( requireDll ).mockImplementation( sourceFiles => {
			return sourceFiles.some( filePath => /-dll.[jt]s$/.test( filePath ) );
		} );

		vi.mocked( compileManualTestScripts ).mockResolvedValue();
		vi.mocked( compileManualTestHtmlFiles ).mockResolvedValue();
		vi.mocked( removeDir ).mockResolvedValue();
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [] );

		vi.spyOn( process, 'cwd' ).mockReturnValue( 'workspace' );

		// The `glob` util returns paths in format depending on the platform.
		vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'linux' );

		defaultOptions = {
			dll: null
		};
	} );

	it( 'should run all manual tests and return promise', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		await runManualTests( defaultOptions );

		expect( vi.mocked( removeDir ) ).toHaveBeenCalledExactlyOnceWith( 'workspace/build/.manual-tests', expect.any( Object ) );
		expect( vi.mocked( createManualTestServer ) ).toHaveBeenCalledExactlyOnceWith(
			'workspace/build/.manual-tests',
			undefined,
			expect.any( Function )
		);
		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			buildDir: 'workspace/build/.manual-tests',
			sourceFiles: [
				'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
				'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			],
			onTestCompilationStatus: expect.any( Function ),
			silent: false
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			cwd: 'workspace',
			buildDir: 'workspace/build/.manual-tests',
			sourceFiles: [
				'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
				'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			],
			themePath: null,
			onTestCompilationStatus: expect.any( Function )
		} ) );
	} );

	it( 'runs specified manual tests', async () => {
		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme',
			debug: [ 'CK_DEBUG' ]
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledWith( 'ckeditor5-classic', true );
		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledWith( 'ckeditor-classic/manual/classic.js', true );
		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			sourceFiles: [
				'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
				'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			]
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			sourceFiles: [
				'workspace/packages/ckeditor5-foo/tests/manual/feature-a.js',
				'workspace/packages/ckeditor5-bar/tests/manual/feature-b.js',
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			],
			debug: [ 'CK_DEBUG' ]
		} ) );
	} );

	it( 'allows specifying language and additionalLanguages (to `CKEditorTranslationsPlugin`)', async () => {
		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme',
			language: 'pl',
			additionalLanguages: [
				'ar',
				'en'
			],
			debug: [ 'CK_DEBUG' ]
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			additionalLanguages: [ 'ar', 'en' ]
		} ) );
	} );

	it( 'allows specifying port', async () => {
		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			port: 8888
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( createManualTestServer ) ).toHaveBeenCalledExactlyOnceWith(
			expect.any( String ),
			8888,
			expect.any( Function )
		);
	} );

	it( 'allows specifying identity file (an absolute path)', async () => {
		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			identityFile: '/absolute/path/to/secrets.js'
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			identityFile: '/absolute/path/to/secrets.js'
		} ) );
	} );

	it( 'allows specifying identity file (a relative path)', async () => {
		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			identityFile: 'path/to/secrets.js'
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			identityFile: 'path/to/secrets.js'
		} ) );
	} );

	it( 'should allow hiding processed files in the console', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		const options = {
			silent: true
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( removeDir ) ).toHaveBeenCalledExactlyOnceWith( expect.any( String ), expect.objectContaining( {
			silent: true
		} ) );
		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			silent: true
		} ) );
	} );

	it( 'should allow disabling listening for changes in source files', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		const options = {
			disableWatch: true
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
	} );

	it( 'compiles only manual test files (ignores utils and files outside the manual directory)', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/_utils/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/outside/**/*.js'
		] );

		const options = {
			disableWatch: true
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			sourceFiles: [
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			]
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			sourceFiles: [
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			]
		} ) );
	} );

	it( 'should start a socket.io server as soon as the http server is up and running', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		const httpServerMock = vi.fn();

		vi.mocked( createManualTestServer ).mockImplementation( ( buildDire, port, onCreate ) => onCreate( httpServerMock ) );

		await runManualTests( defaultOptions );

		expect( vi.mocked( Server ) ).toHaveBeenCalledExactlyOnceWith( httpServerMock );
	} );

	it( 'should set disableWatch to true if files flag is not provided', async () => {
		await runManualTests( defaultOptions );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
	} );

	it( 'should set disableWatch to false if files flag is provided', async () => {
		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			]
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: false
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: false
		} ) );
	} );

	it( 'should read disableWatch flag value even if files flag is provided', async () => {
		const options = {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			disableWatch: true
		};

		await runManualTests( { ...defaultOptions, ...options } );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
	} );

	it( 'should find all CKEditor 5 manual tests if the `files` option is not defined', async () => {
		await runManualTests( defaultOptions );

		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledWith( '*', true );
		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledWith( 'ckeditor5', true );
	} );

	it( 'should not duplicate glob files in the final sourceFiles array', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		await runManualTests( defaultOptions );

		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledTimes( 2 );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			sourceFiles: [
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			]
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			sourceFiles: [
				'workspace/packages/ckeditor-foo/tests/manual/feature-c.js',
				'workspace/packages/ckeditor-bar/tests/manual/feature-d.js'
			]
		} ) );
	} );

	describe( 'DLLs', () => {
		beforeEach( () => {
			vi.mocked( isInteractive ).mockReturnValue( true );

			vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor5-*/tests/**/manual/dll/**/*.js'
			] );
		} );

		it( 'should not build the DLLs if there are no DLL-related manual tests', async () => {
			vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
				'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
			] );

			await runManualTests( defaultOptions );

			expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
			expect( vi.mocked( inquirer ).prompt ).not.toHaveBeenCalled();
			expect( stubs.log.info ).not.toHaveBeenCalled();
			expect( stubs.log.warning ).not.toHaveBeenCalled();
		} );

		it( 'should not build the DLLs if the console is not interactive', async () => {
			vi.mocked( isInteractive ).mockReturnValue( false );

			await runManualTests( defaultOptions );

			expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
			expect( vi.mocked( inquirer ).prompt ).not.toHaveBeenCalled();
			expect( stubs.log.info ).not.toHaveBeenCalled();
			expect( stubs.log.warning ).not.toHaveBeenCalled();
		} );

		it( 'should not build the DLLs and not ask user if `--dll` flag is `false`, even if console is interactive', async () => {
			const options = {
				dll: false
			};

			await runManualTests( { ...defaultOptions, ...options } );

			expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
			expect( vi.mocked( inquirer ).prompt ).not.toHaveBeenCalled();
			expect( stubs.log.info ).not.toHaveBeenCalled();
			expect( stubs.log.warning ).not.toHaveBeenCalled();
		} );

		it( 'should not build the DLLs if user declined the question', async () => {
			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: false } );

			await runManualTests( defaultOptions );

			expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
			expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith( [
				{
					message: 'Create the DLL builds now?',
					type: 'confirm',
					name: 'confirm',
					default: false
				}
			] );
			expect( stubs.log.warning ).toHaveBeenCalledExactlyOnceWith( '\n⚠ Some tests require DLL builds.\n' );
			expect( stubs.log.info ).toHaveBeenCalledTimes( 2 );
			expect( stubs.log.info ).toHaveBeenCalledWith(
				'You don\'t have to update these builds every time unless you want to check changes in DLL tests.'
			);
			expect( stubs.log.info ).toHaveBeenCalledWith(
				'You can use the following flags to skip this prompt in the future: --dll / --no-dll.\n'
			);
			expect( vi.mocked( chalk ).bold ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should open the package.json in each repository in proper order (root repository first, then external ones)', async () => {
			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: true } );
			vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
				name: 'ckeditor5-example-package'
			} ) );

			const consoleStub = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			await runManualTests( defaultOptions );

			expect( consoleStub ).toHaveBeenCalledExactlyOnceWith( '\n📍 DLL building complete.\n' );
			consoleStub.mockRestore();

			// The `path.resolve()` calls are not sorted, so it is called in the same order as data returned from `glob`.
			expect( vi.mocked( path ).resolve ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( path ).resolve ).toHaveBeenCalledWith( 'workspace/ckeditor5-commercial/external/ckeditor5/package.json' );
			expect( vi.mocked( path ).resolve ).toHaveBeenCalledWith( 'workspace/ckeditor5-commercial/package.json' );

			// The `fs.readFileSync()` calls are sorted: root repository first, then external ones.
			expect( vi.mocked( fs ).readFileSync ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).readFileSync ).toHaveBeenNthCalledWith(
				1,
				'/absolute/path/to/workspace/ckeditor5-commercial/external/ckeditor5/package.json',
				'utf-8'
			);

			expect( vi.mocked( fs ).readFileSync ).toHaveBeenNthCalledWith(
				2,
				'/absolute/path/to/workspace/ckeditor5-commercial/package.json',
				'utf-8'
			);
		} );

		it( 'should not build the DLLs if no repository has scripts in package.json', async () => {
			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: true } );
			vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
				name: 'ckeditor5-example-package'
			} ) );

			vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			await runManualTests( defaultOptions );

			expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
		} );

		it( 'should not build the DLLs if no repository has script to build DLLs in package.json', async () => {
			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: true } );
			vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'build': 'node ./scripts/build'
				}
			} ) );

			vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			await runManualTests( defaultOptions );

			expect( vi.mocked( spawn ) ).not.toHaveBeenCalled();
		} );

		it( 'should build the DLLs in each repository that has script to build DLLs in package.json', async () => {
			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: true } );
			vi.mocked( fs ).readFileSync.mockImplementation( input => {
				if ( input === '/absolute/path/to/workspace/ckeditor5/external/collaboration-features/package.json' ) {
					return JSON.stringify( {
						name: 'ckeditor5-example-package',
						scripts: {
							'build': 'node ./scripts/build'
						}
					} );
				}

				return JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'dll:build': 'node ./scripts/build-dll'
					}
				} );
			} );

			vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			await runManualTests( defaultOptions );

			expect( vi.mocked( spawn ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					encoding: 'utf8',
					shell: true,
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial',
					stdio: 'inherit'
				}
			);
			expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					encoding: 'utf8',
					shell: true,
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial/external/ckeditor5',
					stdio: 'inherit'
				}
			);
		} );

		it( 'should build the DLLs automatically and not ask user if `--dll` flag is `true`, even if console is interactive', async () => {
			vi.mocked( fs ).readFileSync.mockImplementation( input => {
				if ( input === '/absolute/path/to/workspace/ckeditor5/external/collaboration-features/package.json' ) {
					return JSON.stringify( {
						name: 'ckeditor5-example-package',
						scripts: {
							'build': 'node ./scripts/build'
						}
					} );
				}

				return JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'dll:build': 'node ./scripts/build-dll'
					}
				} );
			} );

			const options = {
				dll: true
			};

			vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			await runManualTests( { ...defaultOptions, ...options } );

			expect( vi.mocked( spawn ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					encoding: 'utf8',
					shell: true,
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial',
					stdio: 'inherit'
				}
			);
			expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					encoding: 'utf8',
					shell: true,
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial/external/ckeditor5',
					stdio: 'inherit'
				}
			);
		} );

		it( 'should reject a promise if building DLLs has failed', async () => {
			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: true } );
			vi.mocked( fs ).readFileSync.mockImplementation( input => {
				if ( input === '/absolute/path/to/workspace/ckeditor5-commercial/package.json' ) {
					return JSON.stringify( {
						name: 'ckeditor5-example-package',
						scripts: {
							'build': 'node ./scripts/build'
						}
					} );
				}

				return JSON.stringify( {
					name: 'ckeditor5-example-package',
					scripts: {
						'dll:build': 'node ./scripts/build-dll'
					}
				} );
			} );
			stubs.spawn.spawnExitCode = 1;

			await expect( runManualTests( defaultOptions ) )
				.rejects.toThrow( 'Building DLLs in ckeditor5 finished with an error.' );

			expect( vi.mocked( spawn ) ).toHaveBeenCalledExactlyOnceWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					encoding: 'utf8',
					shell: true,
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial/external/ckeditor5',
					stdio: 'inherit'
				}
			);
		} );

		it( 'should build the DLLs in each repository for Windows environment', async () => {
			vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'win32' );

			vi.mocked( inquirer ).prompt.mockResolvedValue( { confirm: true } );
			vi.mocked( fs ).readFileSync.mockReturnValue( JSON.stringify( {
				name: 'ckeditor5-example-package',
				scripts: {
					'dll:build': 'node ./scripts/build-dll'
				}
			} ) );

			vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			await runManualTests( defaultOptions );
			expect( vi.mocked( spawn ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial/external/ckeditor5',
					encoding: 'utf8',
					shell: true,
					stdio: 'inherit'
				}
			);
			expect( vi.mocked( spawn ) ).toHaveBeenCalledWith(
				'pnpm',
				[ 'run', 'dll:build' ],
				{
					cwd: '/absolute/path/to/workspace/ckeditor5-commercial',
					encoding: 'utf8',
					shell: true,
					stdio: 'inherit'
				}
			);
		} );

		it( 'allows specifying tsconfig file', async () => {
			vi.mocked( transformFileOptionToTestGlob )
				.mockReturnValueOnce( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] )
				.mockReturnValueOnce( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

			const options = {
				files: [
					'ckeditor5-classic',
					'ckeditor-classic/manual/classic.js'
				],
				tsconfig: '/absolute/path/to/tsconfig.json'
			};

			await runManualTests( { ...defaultOptions, ...options } );

			expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
				tsconfig: '/absolute/path/to/tsconfig.json'
			} ) );
		} );
	} );
} );
