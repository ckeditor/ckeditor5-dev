/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import { glob } from 'glob';
import prepareRepository from '../../lib/tasks/preparerepository.js';

vi.mock( 'fs/promises' );
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

		expect( vi.mocked( fs ).cp ).not.toHaveBeenCalled();
		expect( vi.mocked( fs ).mkdir ).not.toHaveBeenCalled();
		expect( vi.mocked( fs ).writeFile ).not.toHaveBeenCalled();
	} );

	it( 'should ensure the existence of the output directory', async () => {
		vi.mocked( fs ).readdir.mockResolvedValue( [] );
		options.packagesDirectory = 'packages';

		await prepareRepository( options );

		expect( vi.mocked( fs ).mkdir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).mkdir ).toHaveBeenCalledWith( 'current/working/dir/release', expect.any( Object ) );
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

		expect( vi.mocked( fs ).mkdir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).mkdir ).toHaveBeenCalledWith( 'something/different/than/process/cwd/release', expect.any( Object ) );
	} );

	it( 'should normalize Windows slashes "\\" from "process.cwd()"', async () => {
		vi.mocked( fs ).readdir.mockResolvedValue( [] );
		process.cwd.mockReturnValue( 'C:\\windows\\working\\dir' );
		options.packagesDirectory = 'packages';

		await prepareRepository( options );

		expect( vi.mocked( fs ).mkdir ).toHaveBeenCalled();
		expect( vi.mocked( fs ).mkdir ).toHaveBeenCalledWith( 'C:/windows/working/dir/release', expect.any( Object ) );
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

		it( 'should use the specified `cwd` to resolve the files', async () => {
			options.rootPackageJson = {
				name: 'ckeditor5',
				files: []
			};

			await prepareRepository( {
				...options,
				cwd: '/home/ckeditor/workspace'
			} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.any( Array ), expect.objectContaining( {
				cwd: '/home/ckeditor/workspace'
			} ) );
		} );

		it( 'should resolve to the absolute paths when processing the files', async () => {
			options.rootPackageJson = {
				name: 'ckeditor5',
				files: []
			};

			await prepareRepository( options );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( expect.any( Array ), expect.objectContaining( {
				absolute: true
			} ) );
		} );

		it( 'should create "package.json" file in the root package with provided values', async () => {
			options.rootPackageJson = {
				name: 'ckeditor5',
				description: 'Description.',
				keywords: [ 'foo', 'bar', 'baz' ],
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledExactlyOnceWith(
				'current/working/dir/release/ckeditor5/package.json',
				expect.any( String )
			);
		} );

		it( 'should create a flat output file structure for a scoped package', async () => {
			options.rootPackageJson = {
				name: '@ckeditor/ckeditor5-example',
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledExactlyOnceWith(
				'current/working/dir/release/ckeditor5-example/package.json',
				expect.any( String )
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

			expect( vi.mocked( fs ).cp ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/src/core.js',
				'current/working/dir/release/ckeditor5/src/core.js',
				expect.any( Object )
			);
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/src/utils.js',
				'current/working/dir/release/ckeditor5/src/utils.js',
				expect.any( Object )
			);
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/CHANGELOG.md',
				'current/working/dir/release/ckeditor5/CHANGELOG.md',
				expect.any( Object )
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

			expect( vi.mocked( fs ).writeFile ).not.toHaveBeenCalled();
			expect( vi.mocked( fs ).cp ).not.toHaveBeenCalled();
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

			expect( vi.mocked( fs ).writeFile ).not.toHaveBeenCalled();
			expect( vi.mocked( fs ).cp ).not.toHaveBeenCalled();
		} );

		// See: https://github.com/ckeditor/ckeditor5/issues/19550.
		it( 'must not use `Array#map()` to iterate over files to copy to avoid the "EEXIST" error', async () => {
			let concurrent = 0;

			// This mock aims to disable calling `Array.map( async () => fs.cp() )`.
			vi.mocked( fs ).cp.mockImplementation( async () => {
				if ( concurrent > 1 ) {
					throw new Error( 'Concurrency is disallowed.' );
				}

				concurrent += 1;

				// Simulates the `fs.cp()` action.
				await new Promise( resolve => {
					setTimeout( resolve, 0 );
				} );

				concurrent -= 1;
			} );

			options.rootPackageJson = {
				name: 'ckeditor5',
				files: [ 'src/*.js', 'CHANGELOG.md' ]
			};

			await prepareRepository( options );
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
			vi.mocked( fs ).access.mockResolvedValue( undefined );

			await prepareRepository( options );

			expect( vi.mocked( fs ).cp ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core',
				expect.objectContaining( {
					recursive: true
				} )
			);
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-utils',
				'current/working/dir/release/ckeditor5-utils',
				expect.objectContaining( {
					recursive: true
				} )
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
			vi.mocked( fs ).access.mockResolvedValue( undefined );

			await prepareRepository( options );

			expect( vi.mocked( fs ).lstat ).toHaveBeenCalledWith( 'current/working/dir/packages/textFile.txt' );

			expect( vi.mocked( fs ).cp ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core',
				expect.any( Object )
			);
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-utils',
				'current/working/dir/release/ckeditor5-utils',
				expect.any( Object )
			);
		} );

		it( 'should not copy directories that do not have the "package.json" file', async () => {
			options.packagesDirectory = 'packages';

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );

			vi.mocked( fs ).access.mockImplementation( input => {
				if ( input === 'current/working/dir/packages/ckeditor5-core/package.json' ) {
					return Promise.resolve( undefined );
				}

				const error = new Error( 'No such file or directory' );
				error.code = 'ENOENT';
				error.errno = -2;
				error.syscall = 'access';
				error.path = input;

				return Promise.reject( error );
			} );

			await prepareRepository( options );

			expect( vi.mocked( fs ).cp ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core',
				expect.any( Object )
			);
		} );

		it( 'should copy only the specified packages if the "packagesToCopy" option is provided', async () => {
			options.packagesDirectory = 'packages';
			options.packagesToCopy = [ 'ckeditor5-core' ];

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );
			vi.mocked( fs ).access.mockResolvedValue( undefined );

			await prepareRepository( options );

			expect( vi.mocked( fs ).cp ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/ckeditor5-core',
				'current/working/dir/release/ckeditor5-core',
				expect.any( Object )
			);
		} );

		it( 'should allow copying nested packages via the "packagesToCopy" option', async () => {
			options.packagesDirectory = 'packages';
			options.packagesToCopy = [ 'nested/ckeditor5-nested' ];

			vi.mocked( fs ).lstat.mockResolvedValue( {
				isDirectory: () => true
			} );
			vi.mocked( fs ).access.mockResolvedValue( undefined );

			await prepareRepository( options );

			expect( vi.mocked( fs ).cp ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).cp ).toHaveBeenCalledWith(
				'current/working/dir/packages/nested/ckeditor5-nested',
				'current/working/dir/release/nested/ckeditor5-nested',
				expect.any( Object )
			);
		} );

		// See: https://github.com/ckeditor/ckeditor5/issues/19550.
		it( 'must not use `Array#map()` to iterate over packages to avoid the "EEXIST" error', async () => {
			let concurrent = 0;

			// This mock aims to disable calling `Array.map( async () => fs.lstat() )`.
			vi.mocked( fs ).lstat.mockImplementation( async () => {
				if ( concurrent > 1 ) {
					throw new Error( 'Concurrency is disallowed.' );
				}

				concurrent += 1;

				// Simulates the `fs.cp()` action.
				await new Promise( resolve => {
					setTimeout( resolve, 0 );
				} );

				concurrent -= 1;

				return {
					isDirectory: () => true
				};
			} );
			vi.mocked( fs ).access.mockResolvedValue( undefined );

			options.packagesDirectory = 'packages';

			await prepareRepository( options );
		} );
	} );
} );
