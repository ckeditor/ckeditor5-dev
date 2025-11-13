/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { findPackages } from '../../src/utils/findpackages.js';
import fs from 'fs';
import type { RepositoryConfig } from '../../src/types.js';

vi.mock( 'fs' );
vi.mock( 'upath' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

const cwd = '/local/directory';
const packagesDirectory = '/local/packages';
const externalRepositories: Array<RepositoryConfig> = [
	{ cwd: '/external/repo1', packagesDirectory: '/external/packages1' },
	{ cwd: '/external/repo2', packagesDirectory: '/external/packages2' }
];

describe( 'findPackages()', () => {
	it( 'should return packages from the specified `cwd` directory', async () => {
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValueOnce( [ '/local/package.json' ] );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { name: 'package1', version: '1.0.0' } ) );

		await expect( findPackages( { cwd, packagesDirectory: null, externalRepositories: [] } ) ).resolves.toEqual( new Map( [
			[ 'package1', '1.0.0' ]
		] ) );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledWith(
			cwd,
			null,
			{ includeCwd: true, includePackageJson: true }
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledWith( '/local/package.json', 'utf-8' );
	} );

	it( 'should return an empty array when skipping the root repository package', async () => {
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValueOnce( [] );

		await expect( findPackages( { cwd, packagesDirectory, externalRepositories: [], shouldIgnoreRootPackage: true } ) )
			.resolves.toEqual( new Map( [] ) );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledWith(
			cwd,
			packagesDirectory,
			{ includeCwd: false, includePackageJson: true }
		);
	} );

	it( 'should correctly retrieve package.json files from local and external repositories', async () => {
		vi.mocked( workspaces.findPathsToPackages )
			.mockResolvedValueOnce( [ '/local/package1/package.json', '/local/package2/package.json' ] )
			.mockResolvedValueOnce( [ '/external/package3/package.json' ] )
			.mockResolvedValueOnce( [ '/external/package4/package.json' ] );

		vi.mocked( fs.readFileSync )
			.mockReturnValueOnce( JSON.stringify( { name: 'package1', version: '1.0.0' } ) )
			.mockReturnValueOnce( JSON.stringify( { name: 'package2', version: '1.0.0' } ) )
			.mockReturnValueOnce( JSON.stringify( { name: 'package3', version: '1.0.0' } ) )
			.mockReturnValueOnce( JSON.stringify( { name: 'package4', version: '1.0.0' } ) );

		await expect( findPackages( { cwd, packagesDirectory, externalRepositories } ) ).resolves.toEqual( new Map( [
			[ 'package1', '1.0.0' ],
			[ 'package2', '1.0.0' ],
			[ 'package3', '1.0.0' ],
			[ 'package4', '1.0.0' ]
		] ) );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledWith(
			cwd,
			packagesDirectory,
			{ includeCwd: true, includePackageJson: true }
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledWith( '/local/package1/package.json', 'utf-8' );
	} );

	it( 'should handle errors while reading package.json', async () => {
		vi.mocked( workspaces.findPathsToPackages )
			.mockResolvedValueOnce( [ '/local/package1' ] )
			.mockResolvedValueOnce( [] );

		vi.mocked( fs.readFileSync )
			.mockReturnValueOnce( JSON.stringify( { name: 'package1', version: '1.0.0' } ) )
			.mockImplementationOnce( () => { throw new Error( 'Error reading package.json' ); } );

		await expect( findPackages( { cwd, packagesDirectory, externalRepositories } ) )
			.rejects
			.toThrow( 'Error reading package.json' );
	} );
} );
