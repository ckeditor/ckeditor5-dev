/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import findPathsToPackages from '../../lib/utils/findpathstopackages.js';

vi.mock( 'glob' );

describe( 'findPathsToPackages()', () => {
	it( 'should return an empty array if a package directory is not specified', async () => {
		await expect( findPathsToPackages( '/home/ckeditor', null ) )
			.resolves.toEqual( [] );
	} );

	it( 'should include a cwd directory when `includeCwd=true`', async () => {
		await expect( findPathsToPackages( '/home/ckeditor', null, { includeCwd: true } ) )
			.resolves.toEqual( [ '/home/ckeditor' ] );
	} );

	it( 'should point to a "package.json" file when `includePackageJson=true` (cwd check)', async () => {
		await expect( findPathsToPackages( '/home/ckeditor', null, { includeCwd: true, includePackageJson: true } ) )
			.resolves.toEqual( [ '/home/ckeditor/package.json' ] );
	} );

	it( 'should return an array of packages', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/home/ckeditor/packages/ckeditor5-c',
			'/home/ckeditor/packages/ckeditor5-b',
			'/home/ckeditor/packages/ckeditor5-a'
		] );

		await expect( findPathsToPackages( '/home/ckeditor', 'packages' ) )
			.resolves.toEqual( [
				'/home/ckeditor/packages/ckeditor5-c',
				'/home/ckeditor/packages/ckeditor5-b',
				'/home/ckeditor/packages/ckeditor5-a'
			] );
	} );

	it( 'should return an array of packages including a cwd directory when `includeCwd=true`', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/home/ckeditor/packages/ckeditor5-a'
		] );

		await expect( findPathsToPackages( '/home/ckeditor', 'packages', { includeCwd: true } ) )
			.resolves.toEqual( [
				'/home/ckeditor/packages/ckeditor5-a',
				'/home/ckeditor'
			] );
	} );

	it( 'should return an array of "package.json" paths', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/home/ckeditor/packages/ckeditor5-c/package.json',
			'/home/ckeditor/packages/ckeditor5-b/package.json',
			'/home/ckeditor/packages/ckeditor5-a/package.json'
		] );

		await expect( findPathsToPackages( '/home/ckeditor', 'packages', { includePackageJson: true } ) )
			.resolves.toEqual( [
				'/home/ckeditor/packages/ckeditor5-c/package.json',
				'/home/ckeditor/packages/ckeditor5-b/package.json',
				'/home/ckeditor/packages/ckeditor5-a/package.json'
			] );
	} );

	it( 'should return an array of "package.json" paths including a cwd directory when `includeCwd=true`', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/home/ckeditor/packages/ckeditor5-a/package.json'
		] );

		await expect( findPathsToPackages( '/home/ckeditor', 'packages', { includeCwd: true, includePackageJson: true } ) )
			.resolves.toEqual( [
				'/home/ckeditor/packages/ckeditor5-a/package.json',
				'/home/ckeditor/package.json'
			] );
	} );

	it( 'should filter filter packages when `packagesDirectoryFilter` is defined', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/home/ckeditor/packages/ckeditor5-2',
			'/home/ckeditor/packages/ckeditor5-1',
			'/home/ckeditor/packages/ckeditor5-a',
			'/home/ckeditor/packages/ckeditor5-b'
		] );

		const packagesDirectoryFilter = vi.fn( packageJsonPath => {
			return packageJsonPath.endsWith( 'a' ) || packageJsonPath.endsWith( '1' );
		} );

		await expect( findPathsToPackages( '/home/ckeditor', 'packages', { packagesDirectoryFilter } ) )
			.resolves.toEqual( [
				'/home/ckeditor/packages/ckeditor5-1',
				'/home/ckeditor/packages/ckeditor5-a'
			] );

		expect( packagesDirectoryFilter ).toHaveBeenCalledTimes( 4 );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor/packages/ckeditor5-2' );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor/packages/ckeditor5-1' );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor/packages/ckeditor5-b' );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor/packages/ckeditor5-a' );
	} );

	it( 'should filter filter packages when `packagesDirectoryFilter` is defined (`includeCwd=true` check)', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'/home/ckeditor/packages/ckeditor5-b',
			'/home/ckeditor/packages/ckeditor5-a'
		] );

		const packagesDirectoryFilter = vi.fn( packageJsonPath => {
			return packageJsonPath.endsWith( 'ckeditor' );
		} );

		await expect( findPathsToPackages( '/home/ckeditor', 'packages', { packagesDirectoryFilter, includeCwd: true } ) )
			.resolves.toEqual( [
				'/home/ckeditor'
			] );

		expect( packagesDirectoryFilter ).toHaveBeenCalledTimes( 3 );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor/packages/ckeditor5-b' );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor/packages/ckeditor5-a' );
		expect( packagesDirectoryFilter ).toHaveBeenCalledWith( '/home/ckeditor' );
	} );

	it( 'should search for packages in the specified directory', async () => {
		vi.mocked( glob ).mockResolvedValue( [] );

		await findPathsToPackages( '/home/ckeditor', 'packages' );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( '*/', {
			cwd: '/home/ckeditor/packages',
			absolute: true
		} );
	} );

	it( 'should search for "package.json" files in the specified directory when `includePackageJson=true`', async () => {
		vi.mocked( glob ).mockResolvedValue( [] );

		await findPathsToPackages( '/home/ckeditor', 'packages', { includePackageJson: true } );

		expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith( '*/package.json', expect.objectContaining( {
			nodir: true
		} ) );
	} );

	it( 'should normalize Windows-like paths to Unix-like', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'C:\\home\\ckeditor\\nested\\packages\\ckeditor5-c\\package.json',
			'C:\\home\\ckeditor\\nested\\packages\\ckeditor5-b\\package.json',
			'C:\\home\\ckeditor\\nested\\packages\\ckeditor5-a\\package.json'
		] );

		await expect( findPathsToPackages( 'C:\\home\\ckeditor', 'nested\\packages', { includeCwd: true, includePackageJson: true } ) )
			.resolves.toEqual( [
				'C:/home/ckeditor/nested/packages/ckeditor5-c/package.json',
				'C:/home/ckeditor/nested/packages/ckeditor5-b/package.json',
				'C:/home/ckeditor/nested/packages/ckeditor5-a/package.json',
				'C:/home/ckeditor/package.json'
			] );
	} );
} );
