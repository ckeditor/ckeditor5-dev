/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import webpack from 'webpack';
import getRelativeFilePath from '../../../lib/utils/getrelativefilepath.js';
import getWebpackConfigForManualTests from '../../../lib/utils/manual-tests/getwebpackconfig.js';
import compileManualTestScripts from '../../../lib/utils/manual-tests/compilescripts.js';

vi.mock( 'webpack' );
vi.mock( '../../../lib/utils/getrelativefilepath.js' );
vi.mock( '../../../lib/utils/manual-tests/getwebpackconfig.js' );

describe( 'compileManualTestScripts()', () => {
	let webpackError;

	beforeEach( () => {
		webpackError = null;

		vi.mocked( webpack ).mockImplementation( ( config, callback ) => {
			callback( webpackError );
		} );

		vi.mocked( getWebpackConfigForManualTests ).mockImplementation( ( { entries, buildDir } ) => ( {
			entries,
			buildDir
		} ) );

		vi.mocked( getRelativeFilePath ).mockImplementation( input => input );
	} );

	it( 'should compile manual test scripts', async () => {
		const onTestCompilationStatus = vi.fn();

		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} );

		expect( vi.mocked( getWebpackConfigForManualTests ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus,
			additionalLanguages: [ 'pl', 'ar' ],
			entries: {
				'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.js'
			},
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} ) );

		expect( vi.mocked( webpack ) ).toHaveBeenCalledExactlyOnceWith(
			{
				buildDir: 'buildDir',
				entries: {
					'ckeditor5-foo/manual/file1': 'ckeditor5-foo/manual/file1.js',
					'ckeditor5-foo/manual/file2': 'ckeditor5-foo/manual/file2.js'
				}
			},
			expect.any( Function )
		);
	} );

	it( 'should compile multiple manual test scripts', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-editor-inline/tests/manual/ckeditor.js',
				'ckeditor5-editor-inline/tests/manual/ckeditor.compcat.js',
				'ckeditor5-editor-classic/tests/manual/classic.js'
			],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: vi.fn(),
			additionalLanguages: null,
			tsconfig: undefined
		} );

		expect( vi.mocked( getWebpackConfigForManualTests ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( getRelativeFilePath ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( getRelativeFilePath ) ).toHaveBeenCalledWith( 'ckeditor5-editor-inline/tests/manual/ckeditor.js' );
		expect( vi.mocked( getRelativeFilePath ) ).toHaveBeenCalledWith( 'ckeditor5-editor-inline/tests/manual/ckeditor.compcat.js' );
		expect( vi.mocked( getRelativeFilePath ) ).toHaveBeenCalledWith( 'ckeditor5-editor-classic/tests/manual/classic.js' );
	} );

	it( 'rejects if webpack threw an error', async () => {
		vi.mocked( webpack ).mockImplementation( () => {
			throw new Error( 'Unexpected error' );
		} );

		await expect( compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2.js'
			],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: vi.fn(),
			additionalLanguages: null
		} ) ).rejects.toThrow( 'Unexpected error' );
	} );

	it( 'works on Windows environments', async () => {
		await compileManualTestScripts( {
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-editor-inline\\tests\\manual\\ckeditor.js'
			],
			themePath: 'path/to/theme',
			language: null,
			onTestCompilationStatus: vi.fn(),
			additionalLanguages: null
		} );

		expect( vi.mocked( getRelativeFilePath ) ).toHaveBeenCalledExactlyOnceWith( 'ckeditor5-editor-inline\\tests\\manual\\ckeditor.js' );
	} );

	it( 'should pass identity file to webpack configuration factory', async () => {
		const identityFile = '/foo/bar.js';

		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js',
				'ckeditor5-foo/manual/file2.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: vi.fn(),
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			identityFile,
			disableWatch: false
		} );

		expect( vi.mocked( getWebpackConfigForManualTests ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			identityFile
		} ) );
	} );

	it( 'should pass the "disableWatch" option to webpack configuration factory', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: vi.fn(),
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: true
		} );

		expect( vi.mocked( getWebpackConfigForManualTests ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			disableWatch: true
		} ) );
	} );

	it( 'should pass correct entries object to the webpack for both JS and TS files', async () => {
		await compileManualTestScripts( {
			buildDir: 'buildDir',
			patterns: [ 'manualTestPattern' ],
			sourceFiles: [
				'ckeditor5-foo\\manual\\file1.js',
				'ckeditor5-foo\\manual\\file2.ts'
			],
			themePath: 'path/to/theme',
			language: 'en',
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			disableWatch: false
		} );

		expect( vi.mocked( getWebpackConfigForManualTests ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			entries: {
				'ckeditor5-foo\\manual\\file1': 'ckeditor5-foo\\manual\\file1.js',
				'ckeditor5-foo\\manual\\file2': 'ckeditor5-foo\\manual\\file2.ts'
			}
		} ) );
		expect( vi.mocked( webpack ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			entries: {
				'ckeditor5-foo\\manual\\file1': 'ckeditor5-foo\\manual\\file1.js',
				'ckeditor5-foo\\manual\\file2': 'ckeditor5-foo\\manual\\file2.ts'
			}
		} ), expect.any( Function ) );
	} );

	it( 'should pass the "tsconfig" option to webpack configuration factory', async () => {
		await compileManualTestScripts( {
			cwd: 'workspace',
			buildDir: 'buildDir',
			sourceFiles: [
				'ckeditor5-foo/manual/file1.js'
			],
			themePath: 'path/to/theme',
			language: 'en',
			onTestCompilationStatus: vi.fn(),
			additionalLanguages: [ 'pl', 'ar' ],
			debug: [ 'CK_DEBUG' ],
			tsconfig: '/absolute/path/to/tsconfig.json'
		} );

		expect( vi.mocked( getWebpackConfigForManualTests ) ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
			tsconfig: '/absolute/path/to/tsconfig.json'
		} ) );
	} );
} );
