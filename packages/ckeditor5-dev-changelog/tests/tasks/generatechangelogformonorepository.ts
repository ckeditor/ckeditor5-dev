/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateChangelogForMonoRepository } from '../../src/tasks/generatechangelogformonorepository.js';
import { generateChangelog } from '../../src/utils/generatechangelog.js';

vi.mock( '../../src/utils/generatechangelog.js' );

describe( 'generateChangelogForMonoRepository()', () => {
	const defaultOptions = {
		cwd: '/home/ckeditor',
		packagesDirectory: 'packages',
		nextVersion: '1.1.0',
		date: '2024-03-26',
		externalRepositories: [],
		shouldSkipLinks: false,
		linkFilter: () => true,
		disableFilesystemOperations: false,
		transformScope: ( name: string ) => ( {
			displayName: name,
			npmUrl: `https://www.npmjs.com/package/${ name }`
		} )
	};

	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( generateChangelog ).mockResolvedValue( undefined );
	} );

	describe( 'basic functionality', () => {
		it( 'should call generateChangelog with correct parameters', async () => {
			await generateChangelogForMonoRepository( defaultOptions );

			expect( generateChangelog ).toHaveBeenCalledWith( {
				nextVersion: '1.1.0',
				cwd: '/home/ckeditor',
				packagesDirectory: 'packages',
				externalRepositories: [],
				transformScope: defaultOptions.transformScope,
				date: '2024-03-26',
				shouldSkipLinks: false,
				linkFilter: defaultOptions.linkFilter,
				disableFilesystemOperations: false,
				shouldIgnoreRootPackage: false,
				isSinglePackage: false
			} );
		} );

		it( 'should pass through all provided options', async () => {
			const customOptions = {
				...defaultOptions,
				nextVersion: '2.0.0',
				cwd: '/custom/path',
				packagesDirectory: 'custom-packages',
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

			await generateChangelogForMonoRepository( customOptions );

			expect( generateChangelog ).toHaveBeenCalledWith( {
				nextVersion: '2.0.0',
				cwd: '/custom/path',
				packagesDirectory: 'custom-packages',
				externalRepositories: customOptions.externalRepositories,
				transformScope: customOptions.transformScope,
				date: '2024-03-26',
				shouldSkipLinks: true,
				linkFilter: defaultOptions.linkFilter,
				disableFilesystemOperations: true,
				shouldIgnoreRootPackage: false,
				isSinglePackage: false
			} );
		} );

		it( 'should always set isSinglePackage to false for mono repository', async () => {
			await generateChangelogForMonoRepository( defaultOptions );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					isSinglePackage: false
				} )
			);
		} );
	} );

	describe( 'shouldIgnoreRootPackage handling', () => {
		it( 'should set shouldIgnoreRootPackage to false when not provided', async () => {
			await generateChangelogForMonoRepository( defaultOptions );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					shouldIgnoreRootPackage: false
				} )
			);
		} );

		it( 'should set shouldIgnoreRootPackage to true when both shouldIgnoreRootPackage and npmPackageToCheck are provided', async () => {
			const optionsWithSkipRoot = {
				...defaultOptions,
				shouldIgnoreRootPackage: true as const,
				npmPackageToCheck: 'my-package'
			};

			await generateChangelogForMonoRepository( optionsWithSkipRoot );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					shouldIgnoreRootPackage: true,
					npmPackageToCheck: 'my-package'
				} )
			);
		} );

		it(
			'should set shouldIgnoreRootPackage to false when shouldIgnoreRootPackage is true but npmPackageToCheck is not provided',
			async () => {
				// This test uses 'as any' because we're testing an invalid configuration
				// that wouldn't normally pass TypeScript compilation
				const optionsWithoutNpmPackage = {
					cwd: '/home/ckeditor',
					packagesDirectory: 'packages',
					nextVersion: '1.1.0',
					date: '2024-03-26',
					externalRepositories: [],
					shouldSkipLinks: false,
					disableFilesystemOperations: false,
					transformScope: ( name: string ) => ( {
						displayName: name,
						npmUrl: `https://www.npmjs.com/package/${ name }`
					} ),
					shouldIgnoreRootPackage: true
				} as any;

				await generateChangelogForMonoRepository( optionsWithoutNpmPackage );

				expect( generateChangelog ).toHaveBeenCalledWith(
					expect.objectContaining( {
						shouldIgnoreRootPackage: false
					} )
				);
			}
		);

		it(
			'should set shouldIgnoreRootPackage to false when npmPackageToCheck is provided but shouldIgnoreRootPackage is false',
			async () => {
				const optionsWithNpmPackageButNoSkip = {
					...defaultOptions,
					shouldIgnoreRootPackage: false as const
				};

				await generateChangelogForMonoRepository( optionsWithNpmPackageButNoSkip );

				expect( generateChangelog ).toHaveBeenCalledWith(
					expect.objectContaining( {
						shouldIgnoreRootPackage: false
					} )
				);
			}
		);
	} );

	describe( 'return value handling', () => {
		it( 'should return undefined when disableFilesystemOperations is false', async () => {
			vi.mocked( generateChangelog ).mockResolvedValue( undefined );

			const result = await generateChangelogForMonoRepository( {
				...defaultOptions,
				disableFilesystemOperations: false
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'should return changelog content when disableFilesystemOperations is true', async () => {
			const mockChangelogContent = 'Mock changelog content';
			vi.mocked( generateChangelog ).mockResolvedValue( mockChangelogContent );

			const result = await generateChangelogForMonoRepository( {
				...defaultOptions,
				disableFilesystemOperations: true
			} );

			expect( result ).toBe( mockChangelogContent );
		} );
	} );

	describe( 'optional parameters', () => {
		it( 'should handle missing optional parameters gracefully', async () => {
			const minimalOptions = {
				cwd: '/home/ckeditor',
				packagesDirectory: 'packages',
				transformScope: ( name: string ) => ( {
					displayName: name,
					npmUrl: `https://www.npmjs.com/package/${ name }`
				} )
			};

			await generateChangelogForMonoRepository( minimalOptions );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					cwd: '/home/ckeditor',
					packagesDirectory: 'packages',
					shouldIgnoreRootPackage: false,
					isSinglePackage: false
				} )
			);
		} );

		it( 'should pass undefined values for optional parameters when not provided', async () => {
			const minimalOptions = {
				cwd: '/home/ckeditor',
				packagesDirectory: 'packages',
				transformScope: ( name: string ) => ( {
					displayName: name,
					npmUrl: `https://www.npmjs.com/package/${ name }`
				} )
			};

			await generateChangelogForMonoRepository( minimalOptions );

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
	} );

	describe( 'transformScope function', () => {
		it( 'should pass through custom transformScope function', async () => {
			const customTransformScope = ( name: string ) => ( {
				displayName: `Custom ${ name }`,
				npmUrl: `https://custom.npm.com/${ name }`
			} );

			const optionsWithCustomTransform = {
				...defaultOptions,
				transformScope: customTransformScope
			};

			await generateChangelogForMonoRepository( optionsWithCustomTransform );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					transformScope: customTransformScope
				} )
			);
		} );

		it( 'should handle undefined transformScope', async () => {
			const optionsWithoutTransform = {
				cwd: '/home/ckeditor',
				packagesDirectory: 'packages' as const,
				transformScope: undefined
			};

			await generateChangelogForMonoRepository( optionsWithoutTransform );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					transformScope: undefined
				} )
			);
		} );
	} );

	describe( 'error handling', () => {
		it( 'should propagate errors from generateChangelog', async () => {
			const mockError = new Error( 'Test error' );
			vi.mocked( generateChangelog ).mockRejectedValue( mockError );

			await expect( generateChangelogForMonoRepository( defaultOptions ) )
				.rejects
				.toThrow( 'Test error' );
		} );

		it( 'should not catch or transform errors', async () => {
			const customError = new Error( 'Custom error message' );
			vi.mocked( generateChangelog ).mockRejectedValue( customError );

			await expect( generateChangelogForMonoRepository( defaultOptions ) )
				.rejects
				.toBe( customError );
		} );
	} );

	describe( 'external repositories', () => {
		it( 'should handle empty external repositories array', async () => {
			const optionsWithEmptyExternalRepos = {
				...defaultOptions,
				externalRepositories: []
			};

			await generateChangelogForMonoRepository( optionsWithEmptyExternalRepos );

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
					packagesDirectory: 'modules',
					shouldSkipLinks: true
				}
			];

			const optionsWithMultipleExternalRepos = {
				...defaultOptions,
				externalRepositories: externalRepos
			};

			await generateChangelogForMonoRepository( optionsWithMultipleExternalRepos );

			expect( generateChangelog ).toHaveBeenCalledWith(
				expect.objectContaining( {
					externalRepositories: externalRepos
				} )
			);
		} );
	} );

	describe( 'type checking', () => {
		it( 'should accept valid MonoRepositoryConfig', async () => {
			const validConfig = {
				cwd: '/valid/path',
				packagesDirectory: 'packages',
				nextVersion: '1.0.0',
				date: '2024-01-01',
				externalRepositories: [],
				transformScope: ( name: string ) => ( {
					displayName: name,
					npmUrl: `https://npm.com/${ name }`
				} ),
				shouldSkipLinks: false,
				linkFilter: () => true,
				shouldIgnoreRootPackage: true as const,
				npmPackageToCheck: 'test-package',
				disableFilesystemOperations: false
			};

			// This test primarily validates TypeScript compilation
			await expect( generateChangelogForMonoRepository( validConfig ) )
				.resolves
				.not.toThrow();
		} );
	} );
} );
