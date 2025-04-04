/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { getPackageJsons } from '../../src/utils/getreleasepackagespkgjsons.js';
import fs from 'fs-extra';
import upath from 'upath';
import { findPathsToPackages } from '../../src/utils/external/findpathstopackages.js';
import type { RepositoryConfig } from '../../src/types.js';

vi.mock( 'fs-extra' );
vi.mock( 'upath' );
vi.mock( '../../src/utils/external/findpathstopackages' );

describe( 'getReleasePackagesPkgJsons()', () => {
	const cwd = '/local/directory';
	const packagesDirectory = '/local/packages';
	const externalRepositories: Array<Required<RepositoryConfig>> = [
		{ cwd: '/external/repo1', packagesDirectory: '/external/packages1', skipLinks: false },
		{ cwd: '/external/repo2', packagesDirectory: '/external/packages2', skipLinks: false }
	];

	it( 'should correctly retrieve package.json files from local and external repositories', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [ '/local/package1', '/local/package2' ] )
			.mockResolvedValueOnce( [ '/external/package3' ] )
			.mockResolvedValueOnce( [ '/external/package4' ] );

		vi.mocked( fs.readJson )
			.mockResolvedValueOnce( { name: 'package1', version: '1.0.0' } )
			.mockResolvedValueOnce( { name: 'package2', version: '1.0.0' } )
			.mockResolvedValueOnce( { name: 'package3', version: '1.0.0' } )
			.mockResolvedValueOnce( { name: 'package4', version: '1.0.0' } );

		vi.mocked( upath.join ).mockImplementation( ( ...args: Array<string> ) => args.join( '/' ) );

		const result = await getPackageJsons( cwd, packagesDirectory, externalRepositories );

		expect( result ).toEqual( [
			{ name: 'package1', version: '1.0.0' },
			{ name: 'package2', version: '1.0.0' },
			{ name: 'package3', version: '1.0.0' },
			{ name: 'package4', version: '1.0.0' }
		] );
	} );

	it( 'should handle no packages found in local or external repositories', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [] )
			.mockResolvedValueOnce( [] );

		const result = await getPackageJsons( cwd, packagesDirectory, externalRepositories );

		expect( result ).toEqual( [] );
	} );

	it( 'should handle errors while reading package.json', async () => {
		vi.mocked( findPathsToPackages )
			.mockResolvedValueOnce( [ '/local/package1' ] )
			.mockResolvedValueOnce( [] );

		vi.mocked( fs.readJson )
			.mockResolvedValueOnce( { name: 'package1', version: '1.0.0' } )
			.mockRejectedValueOnce( new Error( 'Error reading package.json' ) );

		await expect( getPackageJsons( cwd, packagesDirectory, externalRepositories ) )
			.rejects
			.toThrow( 'Error reading package.json' );
	} );

	it( 'should handle no external repositories', async () => {
		vi.mocked( findPathsToPackages ).mockResolvedValueOnce( [ '/local/package1' ] );

		vi.mocked( fs.readJson )
			.mockResolvedValueOnce( { name: 'package1', version: '1.0.0' } );

		const result = await getPackageJsons( cwd, packagesDirectory, [] );

		expect( result ).toEqual( [ { name: 'package1', version: '1.0.0' } ] );
	} );
} );
