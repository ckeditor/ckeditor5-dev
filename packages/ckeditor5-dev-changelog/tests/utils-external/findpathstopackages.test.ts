/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findPathsToPackages } from '../../src/utils-external/findpathstopackages.js';
import { glob } from 'glob';
import upath from 'upath';

vi.mock( 'glob' );

describe( 'findPathsToPackages', () => {
	const mockCwd = '/test/cwd';
	const mockPackagesDir = 'packages';
	const getMockGlobResults = () => [
		'/test/cwd/packages/package1',
		'/test/cwd/packages/package2'
	];

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( glob ).mockResolvedValue( getMockGlobResults() );
	} );

	it( 'should find paths to packages without additional options', async () => {
		const result = await findPathsToPackages( mockCwd, mockPackagesDir );

		expect( glob ).toHaveBeenCalledWith( '*/', {
			cwd: upath.join( mockCwd, mockPackagesDir ),
			absolute: true
		} );
		expect( result ).toEqual( getMockGlobResults().map( path => upath.normalize( path ) ) );
	} );

	it( 'should include package.json paths when includePackageJson is true', async () => {
		const mockPackageJsonResults = [
			'/test/cwd/packages/package1/package.json',
			'/test/cwd/packages/package2/package.json'
		];
		vi.mocked( glob ).mockResolvedValue( mockPackageJsonResults );

		const result = await findPathsToPackages( mockCwd, mockPackagesDir, { includePackageJson: true } );

		expect( glob ).toHaveBeenCalledWith( '*/package.json', {
			cwd: upath.join( mockCwd, mockPackagesDir ),
			absolute: true,
			nodir: true
		} );
		expect( result ).toEqual( mockPackageJsonResults.map( path => upath.normalize( path ) ) );
	} );

	it( 'should include cwd when includeCwd is true', async () => {
		const result = await findPathsToPackages( mockCwd, mockPackagesDir, { includeCwd: true } );

		expect( result ).toEqual( [
			...getMockGlobResults().map( path => upath.normalize( path ) ),
			upath.normalize( mockCwd )
		] );
	} );

	it( 'should include cwd with package.json when both includeCwd and includePackageJson are true', async () => {
		const result = await findPathsToPackages( mockCwd, mockPackagesDir, {
			includeCwd: true,
			includePackageJson: true
		} );

		expect( result ).toEqual( [
			...getMockGlobResults().map( path => upath.normalize( path ) ),
			upath.normalize( upath.join( mockCwd, 'package.json' ) )
		] );
	} );

	it( 'should filter paths using packagesDirectoryFilter when provided', async () => {
		const filter = ( path: string ) => path.includes( 'package1' );
		const result = await findPathsToPackages( mockCwd, mockPackagesDir, { packagesDirectoryFilter: filter } );

		expect( result ).toEqual(
			getMockGlobResults()
				.filter( path => filter( path ) )
				.map( path => upath.normalize( path ) )
		);
	} );

	it( 'should return empty array when packagesDirectory is null', async () => {
		const result = await findPathsToPackages( mockCwd, null );

		expect( glob ).not.toHaveBeenCalled();
		expect( result ).toEqual( [] );
	} );

	it( 'should return empty array with cwd when packagesDirectory is null and includeCwd is true', async () => {
		const result = await findPathsToPackages( mockCwd, null, { includeCwd: true } );

		expect( glob ).not.toHaveBeenCalled();
		expect( result ).toEqual( [ upath.normalize( mockCwd ) ] );
	} );
} );
