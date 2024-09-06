/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import { glob } from 'glob';
import assertFilesToPublish from '../../lib/utils/assertfilestopublish.js';

vi.mock( 'fs-extra' );
vi.mock( 'glob' );

describe( 'assertFilesToPublish()', () => {
	it( 'should do nothing if list of packages is empty', async () => {
		await assertFilesToPublish( [] );

		expect( vi.mocked( fs ).readJson ).not.toHaveBeenCalled();
		expect( vi.mocked( glob ) ).not.toHaveBeenCalled();
	} );

	it( 'should read `package.json` from each package', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {} );

		await assertFilesToPublish( [ 'ckeditor5-foo', 'ckeditor5-bar' ] );

		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( 'ckeditor5-foo/package.json' );
		expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( 'ckeditor5-bar/package.json' );
	} );

	it( 'should not check any file if `package.json` does not contain required files', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo'
		} );

		await assertFilesToPublish( [ 'ckeditor5-foo' ] );

		expect( vi.mocked( glob ) ).not.toHaveBeenCalled();
	} );

	it( 'should not throw if all files from `files` field exist', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( [ 'src/index.ts' ] );
			}

			return Promise.resolve( [ 'README.md' ] );
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
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( [ 'src/index.ts' ] );
			}

			return Promise.resolve( [ 'README.md' ] );
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
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( [ 'src/index.ts' ] );
			}

			return Promise.resolve( [ ] );
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
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( [ 'src/index.ts' ] );
			}

			return Promise.resolve( [ 'README.md' ] );
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

	it( 'should consider entry as required if there are not matches in optional entries', () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'README.md'
			]
		} );

		vi.mocked( glob ).mockImplementation( input => {
			if ( input[ 0 ] === 'src' ) {
				return Promise.resolve( [ 'src/index.ts' ] );
			}

			return Promise.resolve( [ 'README.md' ] );
		} );

		const optionalEntries = {
			'ckeditor5-bar': [
				'src',
				'README.md'
			]
		};

		return assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries )
			.then( () => {
				expect( stubs.glob.glob.callCount ).to.equal( 2 );
				expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
				expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
			} );
	} );

	it( 'should not throw if `main` file exists', () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			main: 'src/index.ts',
			files: [
				'src',
				'README.md'
			]
		} );

		stubs.glob.glob
			.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
			.withArgs( [ 'src/index.ts', 'src/index.ts/**' ] ).resolves( [ 'src/index.ts' ] )
			.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

		return assertFilesToPublish( [ 'ckeditor5-foo' ] )
			.then( () => {
				expect( stubs.glob.glob.callCount ).to.equal( 3 );
				expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src/index.ts', 'src/index.ts/**' ] );
				expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
				expect( stubs.glob.glob.thirdCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
			} );
	} );

	it( 'should not throw if `types` file exists', () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			types: 'src/index.d.ts',
			files: [
				'src',
				'README.md'
			]
		} );

		stubs.glob.glob
			.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
			.withArgs( [ 'src/index.d.ts', 'src/index.d.ts/**' ] ).resolves( [ 'src/index.d.ts' ] )
			.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

		return assertFilesToPublish( [ 'ckeditor5-foo' ] )
			.then( () => {
				expect( stubs.glob.glob.callCount ).to.equal( 3 );
				expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src/index.d.ts', 'src/index.d.ts/**' ] );
				expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
				expect( stubs.glob.glob.thirdCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
			} );
	} );

	it( 'should throw if not all files from `files` field exist', () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			files: [
				'src',
				'LICENSE.md',
				'README.md'
			]
		} );

		stubs.glob.glob.resolves( [] );

		return assertFilesToPublish( [ 'ckeditor5-foo' ] )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'Missing files in "ckeditor5-foo" package for entries: "src", "LICENSE.md", "README.md"'
					);
				} );
	} );

	it( 'should throw if file from `main` field does not exist', () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			main: 'src/index.ts'
		} );

		stubs.glob.glob.resolves( [] );

		return assertFilesToPublish( [ 'ckeditor5-foo' ] )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'Missing files in "ckeditor5-foo" package for entries: "src/index.ts"'
					);
				} );
	} );

	it( 'should throw if file from `types` field does not exist', () => {
		vi.mocked( fs ).readJson.mockResolvedValue( {
			name: 'ckeditor5-foo',
			types: 'src/index.d.ts'
		} );

		stubs.glob.glob.resolves( [] );

		return assertFilesToPublish( [ 'ckeditor5-foo' ] )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'Missing files in "ckeditor5-foo" package for entries: "src/index.d.ts"'
					);
				} );
	} );

	it( 'should throw one error for all packages with missing files', () => {
		stubs.fs.readJson
			.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src'
				]
			} )
			.withArgs( 'ckeditor5-bar/package.json' ).resolves( {
				name: 'ckeditor5-bar',
				files: [
					'src',
					'README.md'
				]
			} )
			.withArgs( 'ckeditor5-baz/package.json' ).resolves( {
			name: 'ckeditor5-baz',
			files: [
				'src',
				'LICENSE.md',
				'README.md'
			]
		} );

		stubs.glob.glob.resolves( [] );

		return assertFilesToPublish( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ] )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'Missing files in "ckeditor5-foo" package for entries: "src"\n' +
						'Missing files in "ckeditor5-bar" package for entries: "src", "README.md"\n' +
						'Missing files in "ckeditor5-baz" package for entries: "src", "LICENSE.md", "README.md"'
					);
				} );
	} );
} );
