/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getExternalRepositoriesWithDefaults } from '../../src/utils/getexternalrepositorieswithdefaults.js';
import type { RepositoryConfig } from '../../src/types.js';

describe( 'getExternalRepositoriesWithDefaults', () => {
	it( 'should return empty array when no repositories provided', () => {
		const result = getExternalRepositoriesWithDefaults( [] );
		expect( result ).toEqual( [] );
	} );

	it( 'should add default packagesDirectory if not provided', () => {
		const repositories: Array<RepositoryConfig> = [
			{ cwd: '/path/to/repo' }
		];

		const result = getExternalRepositoriesWithDefaults( repositories );

		expect( result ).toEqual( [
			{ cwd: '/path/to/repo', packagesDirectory: 'packages', skipLinks: false }
		] );
	} );

	it( 'should preserve custom packagesDirectory if provided', () => {
		const repositories: Array<RepositoryConfig> = [
			{ cwd: '/path/to/repo', packagesDirectory: 'custom-packages' }
		];

		const result = getExternalRepositoriesWithDefaults( repositories );

		expect( result ).toEqual( [
			{ cwd: '/path/to/repo', packagesDirectory: 'custom-packages', skipLinks: false }
		] );
	} );

	it( 'should handle multiple repositories', () => {
		const repositories: Array<RepositoryConfig> = [
			{ cwd: '/path/to/repo1', skipLinks: false },
			{ cwd: '/path/to/repo2', packagesDirectory: 'custom', skipLinks: false },
			{ cwd: '/path/to/repo3', skipLinks: false }
		];

		const result = getExternalRepositoriesWithDefaults( repositories );

		expect( result ).toEqual( [
			{ cwd: '/path/to/repo1', packagesDirectory: 'packages', skipLinks: false },
			{ cwd: '/path/to/repo2', packagesDirectory: 'custom', skipLinks: false },
			{ cwd: '/path/to/repo3', packagesDirectory: 'packages', skipLinks: false }
		] );
	} );
} );
