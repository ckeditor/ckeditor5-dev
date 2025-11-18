/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import { glob } from 'glob';
import assertFilesToPublish from '../../lib/utils/assertfilestopublish.js';

vi.mock( 'fs/promises' );
vi.mock( 'glob' );

describe( 'assertFilesToPublish()', () => {
	it( 'should do nothing if list of packages is empty', async () => {
		await assertFilesToPublish( [] );

		expect( vi.mocked( fs ).readFile ).not.toHaveBeenCalled();
		expect( vi.mocked( glob ) ).not.toHaveBeenCalled();
	} );

	it( 'should read `package.json` from each package', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( '{}' );

		await assertFilesToPublish( [ 'ckeditor5-foo', 'ckeditor5-bar' ] );

		expect( vi.mocked( fs ).readFile ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( 'ckeditor5-foo/package.json', 'utf-8' );
		expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( 'ckeditor5-bar/package.json', 'utf-8' );
	} );

	it( 'should not check any file if `package.json` does not contain required files', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo'
		} ) );

		await assertFilesToPublish( [ 'ckeditor5-foo' ] );

		expect( vi.mocked( glob ) ).not.toHaveBeenCalled();
	} );

	it( 'should not throw if all files from `files` field exist', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}

			return Promise.resolve( JSON.stringify( [ 'README.md' ] ) );
		} );

		await assertFilesToPublish( [ 'ckeditor5-foo' ] );

		expect( vi.mocked( glob ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src', 'src/**' ],
			expect.objectContaining( {
				cwd: 'ckeditor5-foo',
				dot: true,
				nodir: true
			} )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'README.md', 'README.md/**' ],
			expect.objectContaining( {
				cwd: 'ckeditor5-foo',
				dot: true,
				nodir: true
			} )
		);
	} );

	it( 'should not throw if all files from `files` field exist except the optional ones (for package)', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}

			return Promise.resolve( JSON.stringify( [ 'README.md' ] ) );
		} );

		const optionalEntries = {
			'ckeditor5-foo': [
				'README.md'
			]
		};

		await assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
			[ 'src', 'src/**' ],
			expect.objectContaining( {
				cwd: 'ckeditor5-foo',
				dot: true,
				nodir: true
			} )
		);
	} );

	it( 'should not throw if all files from `files` field exist except the optional ones (for all packages)', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}

			return Promise.resolve( '[]' );
		} );

		const optionalEntries = {
			'default': [
				'README.md'
			]
		};

		await assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
			[ 'src', 'src/**' ],
			expect.objectContaining( {
				cwd: 'ckeditor5-foo',
				dot: true,
				nodir: true
			} )
		);
	} );

	it( 'should prefer own configuration for optional entries', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}

			return Promise.resolve( JSON.stringify( [ 'README.md' ] ) );
		} );

		const optionalEntries = {
			// Make all entries as required for the "ckeditor5-foo" package.
			'ckeditor5-foo': [],
			'default': [
				'README.md'
			]
		};

		await assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries );

		expect( vi.mocked( glob ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src', 'src/**' ],
			expect.objectContaining( {
				cwd: 'ckeditor5-foo',
				dot: true,
				nodir: true
			} )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'README.md', 'README.md/**' ],
			expect.objectContaining( {
				cwd: 'ckeditor5-foo',
				dot: true,
				nodir: true
			} )
		);
	} );

	it( 'should consider entry as required if there are not matches in optional entries', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}

			return Promise.resolve( JSON.stringify( [ 'README.md' ] ) );
		} );

		const optionalEntries = {
			'ckeditor5-bar': [
				'src',
				'README.md'
			]
		};

		await assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries );

		expect( vi.mocked( glob ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src', 'src/**' ],
			expect.any( Object )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'README.md', 'README.md/**' ],
			expect.any( Object )
		);
	} );

	it( 'should not throw if `main` file exists', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			main: 'src/index.ts',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}
			if ( input[ 0 ] === 'src/index.ts' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}

			return Promise.resolve( JSON.stringify( [ 'README.md' ] ) );
		} );

		await assertFilesToPublish( [ 'ckeditor5-foo' ] );

		expect( vi.mocked( glob ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src', 'src/**' ],
			expect.any( Object )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src/index.ts', 'src/index.ts/**' ],
			expect.any( Object )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'README.md', 'README.md/**' ],
			expect.any( Object )
		);
	} );

	it( 'should not throw if `types` file exists', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			types: 'src/index.d.ts',
			files: [
				'src',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.ts' ] ) );
			}
			if ( input[ 0 ] === 'src/index.d.ts' ) {
				return Promise.resolve( JSON.stringify( [ 'src/index.d.ts' ] ) );
			}

			return Promise.resolve( JSON.stringify( [ 'README.md' ] ) );
		} );

		await assertFilesToPublish( [ 'ckeditor5-foo' ] );

		expect( vi.mocked( glob ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src', 'src/**' ],
			expect.any( Object )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'src/index.d.ts', 'src/index.d.ts/**' ],
			expect.any( Object )
		);
		expect( vi.mocked( glob ) ).toHaveBeenCalledWith(
			[ 'README.md', 'README.md/**' ],
			expect.any( Object )
		);
	} );

	it( 'should throw if not all files from `files` field exist', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'LICENSE.md',
				'README.md'
			]
		} ) );

		vi.mocked( glob ).mockResolvedValue( [] );

		await expect( assertFilesToPublish( [ 'ckeditor5-foo' ] ) )
			.rejects.toThrow( 'Missing files in "ckeditor5-foo" package for entries: "src", "LICENSE.md", "README.md"' );
	} );

	it( 'should throw if file from `main` field does not exist', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			main: 'src/index.ts'
		} ) );

		vi.mocked( glob ).mockResolvedValue( [] );

		await expect( assertFilesToPublish( [ 'ckeditor5-foo' ] ) )
			.rejects.toThrow( 'Missing files in "ckeditor5-foo" package for entries: "src/index.ts"' );
	} );

	it( 'should throw if file from `types` field does not exist', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
			name: 'ckeditor5-foo',
			types: 'src/index.d.ts'
		} ) );

		vi.mocked( glob ).mockResolvedValue( [] );

		await expect( assertFilesToPublish( [ 'ckeditor5-foo' ] ) )
			.rejects.toThrow( 'Missing files in "ckeditor5-foo" package for entries: "src/index.d.ts"' );
	} );

	it( 'should throw one error for all packages with missing files', async () => {
		vi.mocked( fs ).readFile.mockImplementation( input => {
			if ( input === 'ckeditor5-foo/package.json' ) {
				return Promise.resolve( JSON.stringify( {
					name: 'ckeditor5-foo',
					files: [
						'src'
					]
				} ) );
			}

			if ( input === 'ckeditor5-bar/package.json' ) {
				return Promise.resolve( JSON.stringify( {
					name: 'ckeditor5-bar',
					files: [
						'src',
						'README.md'
					]
				} ) );
			}

			return Promise.resolve( JSON.stringify( {
				name: 'ckeditor5-baz',
				files: [
					'src',
					'LICENSE.md',
					'README.md'
				]
			} ) );
		} );

		vi.mocked( glob ).mockResolvedValue( [] );

		const errorMessage = 'Missing files in "ckeditor5-foo" package for entries: "src"\n' +
			'Missing files in "ckeditor5-bar" package for entries: "src", "README.md"\n' +
			'Missing files in "ckeditor5-baz" package for entries: "src", "LICENSE.md", "README.md"';

		await expect( assertFilesToPublish( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ] ) )
			.rejects.toThrow( errorMessage );
	} );
} );
