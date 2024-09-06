/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import { glob } from 'glob';
import prepareRepository from '../../lib/tasks/preparerepository';

vi.mock( 'fs-extra' );
vi.mock( 'glob' );

describe( 'prepareRepository()', () => {
	const packages = [
		'ckeditor5-core',
		'ckeditor5-utils'
	];

	let options;

	beforeEach( () => {
		options = {
			outputDirectory: 'release'
		};

		vi.spyOn( process, 'cwd' ).mockReturnValue( 'current/working/dir' );
	} );

	it( 'should be a function', () => {
		expect( prepareRepository ).to.be.a( 'function' );
	} );

	it( 'should do nothing if neither "rootPackage" or "packagesDirectory" options are defined', async () => {
		await prepareRepository( options );

		expect( vi.mocked( fs ).copy ).not.toHaveBeenCalled();
		expect( vi.mocked( fs ).ensureDir ).not.toHaveBeenCalled();
		expect( vi.mocked( fs ).writeJson ).not.toHaveBeenCalled();
	} );

	it( 'should ensure the existence of the output directory', async () => {
		vi.mocked( fs ).readdir.mockResolvedValue( [] );
		options.packagesDirectory = 'packages';

		await prepareRepository( options );

		expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledWith( 'current/working/dir/release' );
	} );

	it( 'should throw if the output directory is not empty', async () => {
		vi.mocked( fs ).readdir.mockImplementation( input => {
			if ( input === 'current/working/dir/release' ) {
				return Promise.resolve( [ 'someFile.txt' ] );
			}

			return Promise.resolve( [] );
		} );

		options.packagesDirectory = 'packages';

		await prepareRepository( options )
			.then(
				() => {
					throw new Error( 'Expected to throw.' );
				},
				err => {
					expect( err.message ).to.equal( 'Output directory is not empty: "current/working/dir/release".' );
				}
			);

		expect( vi.mocked( fs ).readdir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).readdir ).toHaveBeenCalledWith( 'current/working/dir/release' );
	} );

	it( 'should use the "cwd" option if provided instead of the default "process.cwd()" value', async () => {
		vi.mocked( fs ).readdir.mockResolvedValue( [] );
		options.cwd = 'something/different/than/process/cwd';
		options.packagesDirectory = 'packages';

		await prepareRepository( options );

		expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledWith( 'something/different/than/process/cwd/release' );
	} );

	it( 'should normalize Windows slashes "\\" from "process.cwd()"', async () => {
		vi.mocked( fs ).readdir.mockResolvedValue( [] );
		vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\windows\\working\\dir' );
		options.packagesDirectory = 'packages';

		await prepareRepository( options );

		expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).ensureDir ).toHaveBeenCalledWith( 'C:/windows/working/dir/release' );
	} );

	describe( 'root package processing', () => {
		beforeEach( () => {
			vi.mocked( fs ).readdir.mockResolvedValue( [] );

			vi.mocked( glob ).mockResolvedValue( [
				'current/working/dir/src/core.js',
				'current/working/dir/src/utils.js',
				'current/working/dir/CHANGELOG.md'
			] );
		} );

		it( 'should create "package.json" file in the root package with provided values', async () => {
			options.rootPackageJson = {
				name: 'ckeditor5',
				description: 'Description.',
				keywords: [ 'foo', 'bar', 'baz' ],
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledExactlyOnceWith(
				'current/working/dir/release/ckeditor5/package.json',
				expect.objectContaining( {
					name: 'ckeditor5',
					description: 'Description.',
					keywords: [ 'foo', 'bar', 'baz' ],
					files: [ 'src/*.js', 'CHANGELOG.md' ]
				} ),
				expect.objectContaining( {
					spaces: 2,
					EOL: '\n'
				} )
			);
		} );

		it( 'should create a flat output file structure for a scoped package', async () => {
			options.rootPackageJson = {
				name: '@ckeditor/ckeditor5-example',
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledExactlyOnceWith(
				'current/working/dir/release/ckeditor5-example/package.json',
				expect.any( Object ),
				expect.any( Object )
			);
		} );

		it( 'should copy specified files of the root package', async () => {
			options.rootPackageJson = {
				name: 'ckeditor5',
				description: '',
				keywords: [ 'foo', 'bar', 'baz' ],
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options );

			expect( vi.mocked( fs ).copy ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/src/core.js',
				'current/working/dir/release/ckeditor5/src/core.js'
			);
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/src/utils.js',
				'current/working/dir/release/ckeditor5/src/utils.js'
			);
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/CHANGELOG.md',
				'current/working/dir/release/ckeditor5/CHANGELOG.md'
			);
		} );

		it( 'should throw if "rootPackageJson" is missing the "name" field', async () => {
			options.rootPackageJson = {
				description: '',
				keywords: [ 'foo', 'bar', 'baz' ],
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options )
				.then(
					() => {
						throw new Error( 'Expected to throw.' );
					},
					err => {
						expect( err.message ).to.equal( '"rootPackageJson" option object must have a "name" field.' );
					}
				);

			expect( vi.mocked( fs ).writeJson ).not.toHaveBeenCalled();
			expect( vi.mocked( fs ).copy ).not.toHaveBeenCalled();
		} );

		it( 'should throw if "rootPackageJson" is missing the "files" field', async () => {
			options.rootPackageJson = {
				name: 'ckeditor5',
				description: '',
				keywords: [ 'foo', 'bar', 'baz' ]
			};

			await prepareRepository( options )
				.then(
					() => {
						throw new Error( 'Expected to throw.' );
					},
					err => {
						expect( err.message ).to.equal( '"rootPackageJson" option object must have a "files" field.' );
					}
				);

			expect( vi.mocked( fs ).writeJson ).not.toHaveBeenCalled();
			expect( vi.mocked( fs ).copy ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'monorepository packages processing', () => {
		beforeEach( () => {
			vi.mocked( fs ).readdir.mockImplementation( input => {
				if ( input.endsWith( 'release' ) ) {
					return Promise.resolve( [] );
				}

				return Promise.resolve( packages );
			} );
		} );

		it( 'should copy files of all packages', async () => {
			options.packagesDirectory = 'packages';

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );
			vi.mocked( fs ).exists.mockResolvedValue( true );

			await prepareRepository( options );

			expect( vi.mocked( fs ).copy ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core'
			);
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-utils',
				'current/working/dir/release/ckeditor5-utils'
			);
		} );

		it( 'should not copy non-directories', async () => {
			packages.push( 'textFile.txt' );
			options.packagesDirectory = 'packages';

			vi.mocked( fs ).lstat.mockImplementation( input => {
				// Paths looking like a file are treated as files.
				if ( input.match( /\.[a-z]+$/ ) ) {
					return Promise.resolve( {
						isDirectory: () => false
					} );
				}

				return Promise.resolve( {
					isDirectory: () => true
				} );
			} );
			vi.mocked( fs ).exists.mockResolvedValue( true );

			await prepareRepository( options );

			expect( vi.mocked( fs ).lstat ).toHaveBeenCalledWith( 'current/working/dir/packages/textFile.txt' );

			expect( vi.mocked( fs ).copy ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core'
			);
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-utils',
				'current/working/dir/release/ckeditor5-utils'
			);
		} );

		it( 'should not copy directories that do not have the "package.json" file', async () => {
			options.packagesDirectory = 'packages';

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );

			vi.mocked( fs ).exists.mockImplementation( input => {
				if ( input === 'current/working/dir/packages/ckeditor5-core/package.json' ) {
					return Promise.resolve( true );
				}

				return Promise.resolve( false );
			} );

			await prepareRepository( options );

			expect( vi.mocked( fs ).copy ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core'
			);
		} );

		it( 'should copy only the specified packages if the "packagesToCopy" option is provided', async () => {
			options.packagesDirectory = 'packages';
			options.packagesToCopy = [ 'ckeditor5-core' ];

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );
			vi.mocked( fs ).exists.mockResolvedValue( true );

			await prepareRepository( options );

			expect( vi.mocked( fs ).copy ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core'
			);
		} );

		it( 'should allow copying nested packages via the "packagesToCopy" option', async () => {
			options.packagesDirectory = 'packages';
			options.packagesToCopy = [ 'nested/ckeditor5-nested' ];

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );
			vi.mocked( fs ).exists.mockResolvedValue( true );

			await prepareRepository( options );

			expect( vi.mocked( fs ).copy ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).copy ).toHaveBeenCalledWith(
				'current/working/dir/packages/nested/ckeditor5-nested',
				'current/working/dir/release/nested/ckeditor5-nested'
			);
		} );
	} );
} );
