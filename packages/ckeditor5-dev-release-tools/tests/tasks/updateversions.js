/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import fs from 'fs-extra';
import checkVersionAvailability from '../../lib/utils/checkversionavailability.js';
import updateVersions from '../../lib/tasks/updateversions.js';

vi.mock( 'fs-extra' );
vi.mock( 'glob' );
vi.mock( '../../lib/utils/checkversionavailability.js' );

describe( 'updateVersions()', () => {
	beforeEach( () => {
		vi.mocked( fs ).readJson.mockResolvedValue( { version: '1.0.0' } );
		vi.mocked( glob ).mockResolvedValue( [ '/ckeditor5-dev' ] );
		vi.mocked( checkVersionAvailability ).mockResolvedValue( true );
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/ckeditor5-dev' );
	} );

	it( 'should update the version field in all found packages including the root package', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/ckeditor5-dev/packages/package1/package.json',
			'/ckeditor5-dev/packages/package2/package.json',
			'/ckeditor5-dev/packages/package3/package.json',
			'/ckeditor5-dev/package.json'
		] );

		await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
			[ 'package.json', 'packages/*/package.json' ],
			expect.any( Object )
		);

		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 4 );
		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package1/package.json',
			{
				version: '1.0.1'
			},
			expect.any( Object )
		);
		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package2/package.json',
			{
				version: '1.0.1'
			},
			expect.any( Object )
		);
		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package3/package.json',
			{
				version: '1.0.1'
			},
			expect.any( Object )
		);
		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
			'/ckeditor5-dev/package.json',
			{
				version: '1.0.1'
			},
			expect.any( Object )
		);
	} );

	it( 'should allow filtering out packages that do not pass the `packagesDirectoryFilter` callback', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/ckeditor5-dev/packages/package1/package.json',
			'/ckeditor5-dev/packages/package-bar/package.json',
			'/ckeditor5-dev/packages/package-foo/package.json',
			'/ckeditor5-dev/packages/package-number/package.json',
			'/ckeditor5-dev/package.json'
		] );

		const directoriesToSkip = [
			'package-number'
		];

		await updateVersions( {
			version: '1.0.1',
			packagesDirectory: 'packages',
			packagesDirectoryFilter: packageJsonPath => {
				return !directoriesToSkip.some( item => {
					return upath.dirname( packageJsonPath ).endsWith( item );
				} );
			}
		} );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
			[ 'package.json', 'packages/*/package.json' ],
			expect.any( Object )
		);

		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalled();
		expect( vi.mocked( fs ).writeJson ).not.toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package-number/package.json',
			{
				version: '1.0.1'
			},
			expect.any( Object )
		);
	} );

	it( 'should update the version field in the root package when `packagesDirectory` is not provided', async () => {
		vi.mocked( glob ).mockResolvedValue( [ '/ckeditor5-dev/package.json' ] );

		await updateVersions( { version: '1.0.1' } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
			[ 'package.json' ],
			expect.any( Object )
		);

		expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledExactlyOnceWith(
			'/ckeditor5-dev/package.json',
			{
				version: '1.0.1'
			},
			expect.any( Object )
		);
	} );

	it( 'should throw an error when the version is already in use', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( { version: '1.0.0', name: 'stub-package' } );
		vi.mocked( checkVersionAvailability ).mockResolvedValue( false );

		await expect( updateVersions( { version: '1.0.1' } ) )
			.rejects.toThrow( 'The "stub-package@1.0.1" already exists in the npm registry.' );
	} );

	it( 'should not throw an error when version is not in use', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( { version: '1.0.0', name: 'stub-package' } );
		vi.mocked( checkVersionAvailability ).mockResolvedValue( true );

		await expect( updateVersions( { version: '1.0.1' } ) ).resolves.toBeNil();
	} );

	it( 'should throw an error when it was not possible to check the version availability', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( { version: '1.0.0', name: 'stub-package' } );
		vi.mocked( checkVersionAvailability ).mockRejectedValue( new Error( 'Custom error.' ) );

		await expect( updateVersions( { version: '1.0.1' } ) )
			.rejects.toThrow( 'Custom error.' );
	} );

	it( 'should not use the root package name when checking version availability if `packagesDirectory` is provided', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/ckeditor5-dev/packages/package1/package.json',
			'/ckeditor5-dev/packages/package2/package.json',
			'/ckeditor5-dev/package.json'
		] );

		vi.mocked( fs ).readJson.mockImplementation( input => {
			if ( input === '/ckeditor5-dev/packages/package1/package.json' ) {
				return Promise.resolve( { name: 'package1', version: '1.0.0' } );
			}

			if ( input === '/ckeditor5-dev/packages/package2/package.json' ) {
				return Promise.resolve( { name: 'package2', version: '1.0.0' } );
			}

			return Promise.resolve( { name: 'root-package', version: '1.0.0' } );
		} );

		await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledExactlyOnceWith(
			'1.0.1',
			expect.not.stringContaining( 'root-package' )
		);
	} );

	it( 'should use the root package name when checking version availability if `packagesDirectory` is not provided', async () => {
		vi.mocked( glob ).mockResolvedValue( [ '/ckeditor5-dev/package.json' ] );
		vi.mocked( fs ).readJson.mockResolvedValue( { name: 'root-package', version: '1.0.0' } );

		await updateVersions( { version: '1.0.1' } );

		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledExactlyOnceWith( '1.0.1', 'root-package' );
	} );

	it( 'should accept `0.0.0-nightly*` version for nightly releases', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( { version: '1.0.0', name: 'stub-package' } );

		await expect( updateVersions( { version: '0.0.0-nightly-20230510.0' } ) ).resolves.toBeNil();
	} );

	it( 'should throw when new version is not greater than the current one', async () => {
		vi.mocked( fs ).readJson.mockResolvedValue( { version: '1.0.1' } );

		await expect( updateVersions( { version: '1.0.0' } ) )
			.rejects.toThrow( 'Provided version 1.0.0 must be greater than 1.0.1 or match pattern 0.0.0-nightly.' );
	} );

	it( 'should throw an error when new version is not a valid semver version', async () => {
		await expect( updateVersions( { version: 'x.y.z' } ) )
			.rejects.toThrow( 'Invalid Version: x.y.z' );
	} );

	it( 'should be able to provide custom cwd', async () => {
		await updateVersions( { version: '1.0.1', cwd: 'Users/username/ckeditor5-dev/custom-dir' } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
			expect.any( Array ),
			expect.objectContaining( {
				cwd: 'Users/username/ckeditor5-dev/custom-dir'
			} )
		);
	} );
} );
