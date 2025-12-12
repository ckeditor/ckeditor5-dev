/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import updateDependencies from '../../lib/tasks/updatedependencies.js';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

vi.mock( 'fs/promises' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'updateDependencies()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );
	} );

	describe( 'preparing options', () => {
		beforeEach( () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [] );
		} );

		it( 'should use provided `cwd` to search for packages', async () => {
			const options = {
				cwd: '/work/another/project'
			};

			await updateDependencies( options );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				'/work/another/project',
				null,
				expect.any( Object )
			);
		} );

		it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				'/work/project',
				null,
				expect.any( Object )
			);
		} );

		it( 'should search for "package.json" files', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				expect.anything(),
				null,
				expect.objectContaining( {
					includePackageJson: true
				} )
			);
		} );

		it( 'should include a package included in the "cwd"', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				expect.anything(),
				null,
				expect.objectContaining( {
					includeCwd: true
				} )
			);
		} );

		it( 'should use the `packagesDirectory` option for searching for packages in `cwd`', () => {
			updateDependencies( {
				packagesDirectory: 'packages'
			} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				expect.anything(),
				'packages',
				expect.any( Object )
			);
		} );

		it( 'should convert backslashes to slashes from the `packagesDirectory` (Windows-like paths)', async () => {
			await updateDependencies( {
				packagesDirectory: 'path\\to\\packages\\'
			} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				expect.anything(),
				'path/to/packages',
				expect.any( Object )
			);
		} );

		it( 'should pass `null` as `packagesDirectoryFilter` when searching for packages if not specified', async () => {
			await updateDependencies( {
				version: '^38.0.0',
				packagesDirectory: 'packages'
			} );

			expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
				expect.anything(),
				expect.anything(),
				expect.objectContaining( {
					packagesDirectoryFilter: null
				} )
			);
		} );

		it( 'should allow filtering out packages that do not pass the `packagesDirectoryFilter` callback', async () => {
			const packagesDirectoryFilter = vi.fn();

			await updateDependencies( {
				version: '^38.0.0',
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
	} );

	describe( 'updating dependencies', () => {
		let shouldUpdateVersionCallback;

		beforeEach( () => {
			shouldUpdateVersionCallback = vi.fn( packageName => packageName.startsWith( '@ckeditor' ) );
		} );

		it( 'should read and write `package.json` for each found package', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [
				'/work/project/package.json',
				'/work/project/packages/ckeditor5-foo/package.json',
				'/work/project/packages/ckeditor5-bar/package.json'
			] );

			vi.mocked( fs ).readFile.mockResolvedValue( '{}' );

			await updateDependencies( {
				packagesDirectory: 'packages'
			} );

			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( '/work/project/package.json', 'utf-8' );
			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo/package.json', 'utf-8' );
			expect( vi.mocked( fs ).readFile ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-bar/package.json', 'utf-8' );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/package.json',
				expect.any( String )
			);
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/packages/ckeditor5-foo/package.json',
				expect.any( String )
			);
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/packages/ckeditor5-bar/package.json',
				expect.any( String )
			);
		} );

		it( 'should update eligible dependencies from the `dependencies` key', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
				dependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} ) );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback
			} );

			expect( shouldUpdateVersionCallback ).toHaveBeenCalledTimes( 4 );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-engine' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-enter' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-essentials' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( 'lodash-es' );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/package.json',
				JSON.stringify( {
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				}, null, 2 )
			);
		} );

		it( 'should update eligible dependencies from the `devDependencies` key', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
				devDependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} ) );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback
			} );

			expect( shouldUpdateVersionCallback ).toHaveBeenCalledTimes( 4 );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-engine' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-enter' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-essentials' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( 'lodash-es' );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/package.json',
				JSON.stringify( {
					devDependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				}, null, 2 )
			);
		} );

		it( 'should update eligible dependencies from the `peerDependencies` key', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
				peerDependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} ) );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback
			} );

			expect( shouldUpdateVersionCallback ).toHaveBeenCalledTimes( 4 );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-engine' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-enter' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-essentials' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( 'lodash-es' );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/package.json',
				JSON.stringify( {
					peerDependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				}, null, 2 )
			);
		} );

		it( 'should not update any package if `shouldUpdateVersionCallback` callback resolves falsy value', async () => {
			vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readFile.mockResolvedValue( JSON.stringify( {
				dependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} ) );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback: () => false
			} );

			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeFile ).toHaveBeenCalledWith(
				'/work/project/package.json',
				JSON.stringify( {
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				}, null, 2 )
			);
		} );
	} );
} );
