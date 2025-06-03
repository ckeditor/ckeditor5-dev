/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { utils } from '../../src/utils/utils';
import type { RepositoryConfig } from '../../src/types.js';

describe( 'getExternalRepositoriesWithDefaults()', () => {
	it( 'should return empty array when no repositories provided', () => {
		const result = utils( [] );
		expect( result ).toEqual( [] );
	} );

	it( 'should add default packagesDirectory if not provided', () => {
		const repositories: Array<RepositoryConfig> = [
			{ cwd: '/path/to/repo' }
		];

		const result = utils( repositories );

		expect( result ).toEqual( [
			{ cwd: '/path/to/repo', packagesDirectory: 'packages', skipLinks: false }
		] );
	} );

	it( 'should preserve custom packagesDirectory if provided', () => {
		const repositories: Array<RepositoryConfig> = [
			{ cwd: '/path/to/repo', packagesDirectory: 'custom-packages' }
		];

		const result = utils( repositories );

		expect( result ).toEqual( [
			{ cwd: '/path/to/repo', packagesDirectory: 'custom-packages', skipLinks: false }
		] );
	} );

	it( 'should handle multiple repositories', () => {
		const repositories: Array<RepositoryConfig> = [
			{ cwd: '/path/to/repo1', shouldSkipLinks: false },
			{ cwd: '/path/to/repo2', packagesDirectory: 'custom', shouldSkipLinks: false },
			{ cwd: '/path/to/repo3', shouldSkipLinks: false }
		];

		const result = utils( repositories );

		expect( result ).toEqual( [
			{ cwd: '/path/to/repo1', packagesDirectory: 'packages', skipLinks: false },
			{ cwd: '/path/to/repo2', packagesDirectory: 'custom', skipLinks: false },
			{ cwd: '/path/to/repo3', packagesDirectory: 'packages', skipLinks: false }
		] );
	} );
} );
