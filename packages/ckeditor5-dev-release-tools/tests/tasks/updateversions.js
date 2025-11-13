/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import updateVersions from '../../lib/tasks/updateversions.js';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'fs/promises' );

describe( 'updateVersions()', () => {
	beforeEach( () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( { version: '1.0.0' } ) );
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/ckeditor5-dev' ] );
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/ckeditor5-dev' );
	} );

	it( 'should update the version field in all found packages including the root package', async () => {
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [
			'/ckeditor5-dev/packages/package1/package.json',
			'/ckeditor5-dev/packages/package2/package.json',
			'/ckeditor5-dev/packages/package3/package.json',
			'/ckeditor5-dev/package.json'
		] );

		await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			'/ckeditor5-dev',
			'packages',
			{
				includePackageJson: true,
				includeCwd: true,
				packagesDirectoryFilter: null
			}
		);

		expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledTimes( 4 );
		expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package1/package.json',
			JSON.stringify( { version: '1.0.1' }, null, 2 )
		);
		expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package2/package.json',
			JSON.stringify( { version: '1.0.1' }, null, 2 )
		);
		expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
			'/ckeditor5-dev/packages/package3/package.json',
			JSON.stringify( { version: '1.0.1' }, null, 2 )
		);
		expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
			'/ckeditor5-dev/package.json',
			JSON.stringify( { version: '1.0.1' }, null, 2 )
		);
	} );

	it( 'should allow filtering out packages that do not pass the `packagesDirectoryFilter` callback', async () => {
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [
			'/ckeditor5-dev/packages/package1/package.json',
			'/ckeditor5-dev/packages/package-bar/package.json',
			'/ckeditor5-dev/packages/package-foo/package.json',
			'/ckeditor5-dev/package.json'
		] );

		const packagesDirectoryFilter = vi.fn();

		await updateVersions( {
			version: '1.0.1',
			packagesDirectory: 'packages',
			packagesDirectoryFilter
		} );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining( {
				packagesDirectoryFilter
			} )
		);
	} );

	it( 'should update the version field in the root package when `packagesDirectory` is not provided', async () => {
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/ckeditor5-dev/package.json' ] );

		await updateVersions( { version: '1.0.1' } );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			'/ckeditor5-dev',
			null,
			expect.any( Object )
		);

		expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledExactlyOnceWith(
			'/ckeditor5-dev/package.json',
			JSON.stringify( { version: '1.0.1' }, null, 2 )
		);
	} );

	it( 'should accept `0.0.0-nightly*` version for nightly releases', async () => {
		vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( { version: '1.0.0', name: 'stub-package' } ) );

		await expect( updateVersions( { version: '0.0.0-nightly-20230510.0' } ) ).resolves.toBeNil();
	} );

	it( 'should throw an error when new version is not a valid semver version', async () => {
		await expect( updateVersions( { version: 'x.y.z' } ) )
			.rejects.toThrow( 'Provided version x.y.z must follow the "Semantic Versioning" standard.' );
	} );

	it( 'should be able to provide custom cwd', async () => {
		await updateVersions( { version: '1.0.1', cwd: 'C:/Users/username/ckeditor5-dev/custom-dir' } );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			'C:/Users/username/ckeditor5-dev/custom-dir',
			null,
			expect.any( Object )
		);
	} );
} );
