/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import findMessages from '../../lib/findmessages.js';
import getTypeScriptMessages from '../../lib/utils/gettypescriptmessages.js';
import isFileInDirectory from '../../lib/utils/isfileindirectory.js';
import getSourceMessages from '../../lib/utils/getsourcemessages.js';

vi.mock( 'node:fs' );
vi.mock( '../../lib/utils/isfileindirectory.js' );
vi.mock( '../../lib/findmessages.js' );
vi.mock( '../../lib/utils/gettypescriptmessages.js' );

describe( 'getSourceMessages()', () => {
	let defaultOptions;

	beforeEach( () => {
		defaultOptions = {
			cwd: '/absolute/path/to',
			packagePaths: [ '/absolute/path/to/packages/ckeditor5-foo' ],
			sourceFiles: [
				'/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				'/absolute/path/to/packages/ckeditor5-bar/src/utils/file.ts'
			],
			onErrorCallback: vi.fn()
		};

		vi.mocked( fs.readFileSync ).mockImplementation( path => {
			if ( path === '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts' ) {
				return 'Content from file.ts.';
			}

			throw new Error( `ENOENT: no such file or directory, open ${ path }` );
		} );

		vi.mocked( isFileInDirectory ).mockImplementation( ( filePath, directoryPath ) => filePath.startsWith( directoryPath ) );
		vi.mocked( getTypeScriptMessages ).mockReturnValue( null );
	} );

	it( 'should be a function', () => {
		expect( getSourceMessages ).toBeInstanceOf( Function );
	} );

	it( 'should read source files only from provided packages', () => {
		getSourceMessages( defaultOptions );

		expect( getTypeScriptMessages ).toHaveBeenCalledWith( {
			cwd: '/absolute/path/to',
			sourceFiles: [ '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts' ],
			onErrorCallback: defaultOptions.onErrorCallback
		} );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts', 'utf-8' );
	} );

	it( 'should find messages from source files', () => {
		getSourceMessages( defaultOptions );

		expect( findMessages ).toHaveBeenCalledTimes( 1 );
		expect( findMessages ).toHaveBeenCalledWith(
			'Content from file.ts.',
			'/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
			expect.any( Function ),
			defaultOptions.onErrorCallback
		);
	} );

	it( 'should return found messages from source files', () => {
		vi.mocked( findMessages ).mockImplementation( ( fileContent, filePath, onMessageCallback ) => {
			onMessageCallback( { id: 'id1', string: 'Example message 1.' } );
			onMessageCallback( { id: 'id2', string: 'Example message 2.' } );
		} );

		const result = getSourceMessages( defaultOptions );

		expect( result ).toEqual( [
			{
				filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				packagePath: '/absolute/path/to/packages/ckeditor5-foo',
				id: 'id1',
				string: 'Example message 1.'
			},
			{
				filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				packagePath: '/absolute/path/to/packages/ckeditor5-foo',
				id: 'id2',
				string: 'Example message 2.'
			}
		] );
	} );

	it( 'should use messages collected with TypeScript when available', () => {
		vi.mocked( getTypeScriptMessages ).mockReturnValue( new Map( [ [
			'/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
			[
				{ id: 'id1', string: 'Example message 1.' },
				{ id: 'id2', string: 'Example message 2.' }
			]
		] ] ) );

		const result = getSourceMessages( defaultOptions );

		expect( fs.readFileSync ).not.toHaveBeenCalled();
		expect( findMessages ).not.toHaveBeenCalled();

		expect( result ).toEqual( [
			{
				filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				packagePath: '/absolute/path/to/packages/ckeditor5-foo',
				id: 'id1',
				string: 'Example message 1.'
			},
			{
				filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				packagePath: '/absolute/path/to/packages/ckeditor5-foo',
				id: 'id2',
				string: 'Example message 2.'
			}
		] );
	} );

	it( 'should not find messages if package paths do not match exactly the file path', () => {
		vi.mocked( isFileInDirectory ).mockReturnValue( false );

		getSourceMessages( defaultOptions );

		expect( findMessages ).not.toHaveBeenCalled();
	} );

	it( 'should call error callback in case of an error', () => {
		vi.mocked( findMessages ).mockImplementation( ( fileContent, filePath, onMessageCallback, onErrorCallback ) => {
			onErrorCallback( 'Example problem has been detected.' );
		} );

		getSourceMessages( defaultOptions );

		expect( defaultOptions.onErrorCallback ).toHaveBeenCalledWith( 'Example problem has been detected.' );
	} );
} );
