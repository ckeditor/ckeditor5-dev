/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChangelogForSingleRepository } from '../../src/tasks/generatechangelogforsinglerepository.js';
import { generateChangelog } from '../../src/utils/generatechangelog.js';

vi.mock( '../../src/utils/generatechangelog.js' );

describe( 'generateChangelogForSingleRepository()', () => {
	const defaultOptions = {
		cwd: '/home/ckeditor',
		nextVersion: '1.1.0',
		date: '2024-03-26',
		externalRepositories: [],
		shouldSkipLinks: false,
		linkFilter: () => true,
		disableFilesystemOperations: false
	};

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( generateChangelog ).mockResolvedValue( undefined );
	} );

	describe( 'basic functionality', () => {
		it( 'should call generateChangelog with correct parameters', async () => {
			await generateChangelogForSingleRepository( defaultOptions );

			expect( generateChangelog ).toHaveBeenCalledWith( {
				nextVersion: '1.1.0',
				cwd: '/home/ckeditor',
				externalRepositories: [],
				date: '2024-03-26',
				shouldSkipLinks: false,
				linkFilter: defaultOptions.linkFilter,
				disableFilesystemOperations: false,
				isSinglePackage: true,
				packagesDirectory: null
			} );
		} );

		it( 'should pass through all provided options', async () => {
			const customOptions = {
				...defaultOptions,
				nextVersion: '2.0.0',
				cwd: '/custom/path',
				shouldSkipLinks: true,
				disableFilesystemOperations: true,
				externalRepositories: [
					{
						cwd: '/external/repo',
						packagesDirectory: 'packages',
						shouldSkipLinks: false
					}
				]
			};

			await generateChangelogForSingleRepository( customOptions );

			expect( generateChangelog ).toHaveBeenCalledWith( {
				nextVersion: '2.0.0',
				cwd: '/custom/path',
				externalRepositories: customOptions.externalRepositories,
				date: '2024-03-26',
				shouldSkipLinks: true,
				linkFilter: defaultOptions.linkFilter,
				disableFilesystemOperations: true,
				isSinglePackage: true,
				packagesDirectory: null
			} );
		} );

		it( 'should always set isSinglePackage to true for single repository', async () => {
			await generateChangelogForSingleRepository( defaultOptions );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					isSinglePackage: true
				} )
			);
		} );

		it( 'should always set packagesDirectory to null for single repository', async () => {
			await generateChangelogForSingleRepository( defaultOptions );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					packagesDirectory: null
				} )
			);
		} );
	} );

	describe( 'return value handling', () => {
		it( 'should return undefined when disableFilesystemOperations is false', async () => {
			vi.mocked( generateChangelog ).mockResolvedValue( undefined );

			const result = await generateChangelogForSingleRepository( {
				...defaultOptions,
				disableFilesystemOperations: false
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'should return changelog content when disableFilesystemOperations is true', async () => {
			const mockChangelogContent = 'Mock changelog content';
			vi.mocked( generateChangelog ).mockResolvedValue( mockChangelogContent );

			const result = await generateChangelogForSingleRepository( {
				...defaultOptions,
				disableFilesystemOperations: true
			} );

			expect( result ).toBe( mockChangelogContent );
		} );
	} );

	describe( 'optional parameters', () => {
		it( 'should handle missing optional parameters gracefully', async () => {
			const minimalOptions = {
				cwd: '/home/ckeditor'
			};

			await generateChangelogForSingleRepository( minimalOptions );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					cwd: '/home/ckeditor',
					isSinglePackage: true,
					packagesDirectory: null
				} )
			);
		} );

		it( 'should pass undefined values for optional parameters when not provided', async () => {
			const minimalOptions = {
				cwd: '/home/ckeditor'
			};

			await generateChangelogForSingleRepository( minimalOptions );

			const callArgs = vi.mocked( generateChangelog ).mock.calls[ 0 ]?.[ 0 ];

			expect( callArgs ).toEqual( expect.objectContaining( {
				nextVersion: undefined,
				externalRepositories: undefined,
				date: undefined,
				shouldSkipLinks: undefined,
				linkFilter: undefined,
				disableFilesystemOperations: undefined
			} ) );
		} );

		it( 'should handle nextVersion as string', async () => {
			const optionsWithVersion = {
				...defaultOptions,
				nextVersion: '3.0.0-beta.1'
			};

			await generateChangelogForSingleRepository( optionsWithVersion );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					nextVersion: '3.0.0-beta.1'
				} )
			);
		} );

		it( 'should handle custom date format', async () => {
			const optionsWithCustomDate = {
				...defaultOptions,
				date: '2025-12-31'
			};

			await generateChangelogForSingleRepository( optionsWithCustomDate );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					date: '2025-12-31'
				} )
			);
		} );
	} );

	describe( 'external repositories', () => {
		it( 'should handle empty external repositories array', async () => {
			const optionsWithEmptyExternalRepos = {
				...defaultOptions,
				externalRepositories: []
			};

			await generateChangelogForSingleRepository( optionsWithEmptyExternalRepos );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					externalRepositories: []
				} )
			);
		} );

		it( 'should pass through multiple external repositories', async () => {
			const externalRepos = [
				{
					cwd: '/external/repo1',
					packagesDirectory: 'packages',
					shouldSkipLinks: false
				},
				{
					cwd: '/external/repo2',
					packagesDirectory: null,
					shouldSkipLinks: true
				}
			];

			const optionsWithMultipleExternalRepos = {
				...defaultOptions,
				externalRepositories: externalRepos
			};

			await generateChangelogForSingleRepository( optionsWithMultipleExternalRepos );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					externalRepositories: externalRepos
				} )
			);
		} );

		it( 'should handle external repositories with null packagesDirectory', async () => {
			const externalRepos = [
				{
					cwd: '/external/single-repo',
					packagesDirectory: null,
					shouldSkipLinks: false
				}
			];

			const optionsWithSingleRepoExternal = {
				...defaultOptions,
				externalRepositories: externalRepos
			};

			await generateChangelogForSingleRepository( optionsWithSingleRepoExternal );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					externalRepositories: externalRepos
				} )
			);
		} );
	} );

	describe( 'error handling', () => {
		it( 'should propagate errors from generateChangelog', async () => {
			const mockError = new Error( 'Test error' );
			vi.mocked( generateChangelog ).mockRejectedValue( mockError );

			await expect( generateChangelogForSingleRepository( defaultOptions ) )
				.rejects
				.toThrow( 'Test error' );
		} );

		it( 'should not catch or transform errors', async () => {
			const customError = new Error( 'Custom error message' );
			vi.mocked( generateChangelog ).mockRejectedValue( customError );

			await expect( generateChangelogForSingleRepository( defaultOptions ) )
				.rejects
				.toBe( customError );
		} );

		it( 'should handle async errors properly', async () => {
			const asyncError = new Error( 'Async operation failed' );
			vi.mocked( generateChangelog ).mockImplementation( async () => {
				throw asyncError;
			} );

			await expect( generateChangelogForSingleRepository( defaultOptions ) )
				.rejects
				.toBe( asyncError );
		} );
	} );

	describe( 'shouldSkipLinks parameter', () => {
		it( 'should pass shouldSkipLinks as true', async () => {
			const optionsWithSkipLinks = {
				...defaultOptions,
				shouldSkipLinks: true
			};

			await generateChangelogForSingleRepository( optionsWithSkipLinks );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					shouldSkipLinks: true
				} )
			);
		} );

		it( 'should pass shouldSkipLinks as false', async () => {
			const optionsWithoutSkipLinks = {
				...defaultOptions,
				shouldSkipLinks: false
			};

			await generateChangelogForSingleRepository( optionsWithoutSkipLinks );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					shouldSkipLinks: false
				} )
			);
		} );
	} );

	describe( 'type checking', () => {
		it( 'should accept valid SingleRepositoryConfig', async () => {
			const validConfig = {
				cwd: '/valid/path',
				nextVersion: '1.0.0',
				date: '2024-01-01',
				externalRepositories: [],
				shouldSkipLinks: false,
				linkFilter: () => true,
				disableFilesystemOperations: false
			};

			// This test primarily validates TypeScript compilation
			await expect( generateChangelogForSingleRepository( validConfig ) )
				.resolves
				.not.toThrow();
		} );
	} );
} );
