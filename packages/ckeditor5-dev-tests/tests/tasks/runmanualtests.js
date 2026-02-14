/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { Server } from 'socket.io';
import { globSync } from 'glob';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
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
	}
} ) );

vi.mock( 'socket.io' );
vi.mock( 'glob' );
vi.mock( 'util', () => ( {
	styleText: vi.fn( ( _style, text ) => text )
} ) );
vi.mock( 'path' );
vi.mock( 'fs' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../lib/utils/manual-tests/createserver.js' );
vi.mock( '../../lib/utils/manual-tests/compilehtmlfiles.js' );
vi.mock( '../../lib/utils/manual-tests/compilescripts.js' );
vi.mock( '../../lib/utils/manual-tests/removedir.js' );
vi.mock( '../../lib/utils/manual-tests/copyassets.js' );
vi.mock( '../../lib/utils/transformfileoptiontotestglob.js' );

describe( 'runManualTests()', () => {
	beforeEach( () => {
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

		vi.mocked( compileManualTestScripts ).mockResolvedValue();
		vi.mocked( compileManualTestHtmlFiles ).mockResolvedValue();
		vi.mocked( removeDir ).mockResolvedValue();
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [] );

		vi.spyOn( process, 'cwd' ).mockReturnValue( 'workspace' );

		// The `glob` util returns paths in format depending on the platform.
		vi.spyOn( process, 'platform', 'get' ).mockReturnValue( 'linux' );
	} );

	it( 'should run all manual tests and return promise', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		await runManualTests( {} );

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
			onTestCompilationStatus: expect.any( Function )
		} ) );
	} );

	it( 'runs specified manual tests', async () => {
		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			debug: [ 'CK_DEBUG' ]
		} );

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
		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			language: 'pl',
			additionalLanguages: [
				'ar',
				'en'
			],
			debug: [ 'CK_DEBUG' ]
		} );

		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			additionalLanguages: [ 'ar', 'en' ]
		} ) );
	} );

	it( 'allows specifying port', async () => {
		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' ] )
			.mockReturnValueOnce( [ 'workspace/packages/ckeditor-*/tests/**/manual/**/*.js' ] );

		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			port: 8888
		} );

		expect( vi.mocked( createManualTestServer ) ).toHaveBeenCalledExactlyOnceWith(
			expect.any( String ),
			8888,
			expect.any( Function )
		);
	} );

	it( 'allows specifying identity file (an absolute path)', async () => {
		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			identityFile: '/absolute/path/to/secrets.js'
		} );

		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			identityFile: '/absolute/path/to/secrets.js'
		} ) );
	} );

	it( 'allows specifying identity file (a relative path)', async () => {
		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			identityFile: 'path/to/secrets.js'
		} );

		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			identityFile: 'path/to/secrets.js'
		} ) );
	} );

	it( 'should allow hiding processed files in the console', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		await runManualTests( {
			silent: true
		} );

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

		await runManualTests( {
			disableWatch: true
		} );

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

		await runManualTests( {
			disableWatch: true
		} );

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

		await runManualTests( {} );

		expect( vi.mocked( Server ) ).toHaveBeenCalledExactlyOnceWith( httpServerMock );
	} );

	it( 'should set disableWatch to true if files flag is not provided', async () => {
		await runManualTests( {} );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
	} );

	it( 'should set disableWatch to false if files flag is provided', async () => {
		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			]
		} );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: false
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: false
		} ) );
	} );

	it( 'should read disableWatch flag value even if files flag is provided', async () => {
		await runManualTests( {
			files: [
				'ckeditor5-classic',
				'ckeditor-classic/manual/classic.js'
			],
			disableWatch: true
		} );

		expect( vi.mocked( compileManualTestHtmlFiles ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
		expect( vi.mocked( compileManualTestScripts ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
	} );

	it( 'should find all CKEditor 5 manual tests if the `files` option is not defined', async () => {
		await runManualTests( {} );

		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledWith( '*', true );
		expect( vi.mocked( transformFileOptionToTestGlob ) ).toHaveBeenCalledWith( 'ckeditor5', true );
	} );

	it( 'should not duplicate glob files in the final sourceFiles array', async () => {
		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
		] );

		await runManualTests( {} );

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
} );
