/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import { glob } from 'glob';
import upath from 'upath';
import updateDependencies from '../../lib/tasks/updatedependencies.js';

vi.mock( 'fs-extra' );
vi.mock( 'glob' );

describe( 'updateDependencies()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/project' );
	} );

	describe( 'preparing options', () => {
		beforeEach( () => {
			vi.mocked( glob ).mockResolvedValue( [] );
		} );

		it( 'should use provided `cwd` to search for packages', async () => {
			const options = {
				cwd: '/work/another/project'
			};

			await updateDependencies( options );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				[ 'package.json' ],
				expect.objectContaining( {
					cwd: '/work/another/project'
				} )
			);
		} );

		it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				[ 'package.json' ],
				expect.objectContaining( {
					cwd: '/work/project'
				} )
			);
		} );

		it( 'should match only files', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				expect.any( Array ),
				expect.objectContaining( {
					nodir: true
				} )
			);
		} );

		it( 'should always receive absolute paths for matched files', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				expect.any( Array ),
				expect.objectContaining( {
					absolute: true
				} )
			);
		} );

		it( 'should use the `packagesDirectory` option for searching for packages in `cwd`', () => {
			updateDependencies( {
				packagesDirectory: 'packages'
			} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				[
					'package.json',
					'packages/*/package.json'
				],
				expect.any( Object )
			);
		} );

		it( 'should not search for packages if the `packagesDirectory` option is not provided', async () => {
			await updateDependencies( {} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				[ 'package.json' ],
				expect.any( Object )
			);
		} );

		it( 'should convert backslashes to slashes from the `packagesDirectory` (Windows-like paths)', async () => {
			await updateDependencies( {
				packagesDirectory: 'path\\to\\packages\\'
			} );

			expect( vi.mocked( glob ) ).toHaveBeenCalledExactlyOnceWith(
				[
					'package.json',
					'path/to/packages/*/package.json'
				],
				expect.any( Object )
			);
		} );
	} );

	describe( 'updating dependencies', () => {
		let shouldUpdateVersionCallback;

		beforeEach( () => {
			shouldUpdateVersionCallback = vi.fn( packageName => packageName.startsWith( '@ckeditor' ) );
		} );

		it( 'should read and write `package.json` for each found package', async () => {
			vi.mocked( glob ).mockImplementation( patterns => {
				const paths = {
					'package.json': [
						'/work/project/package.json'
					],
					'packages/*/package.json': [
						'/work/project/packages/ckeditor5-foo/package.json',
						'/work/project/packages/ckeditor5-bar/package.json'
					]
				};

				return Promise.resolve(
					patterns.flatMap( pattern => paths[ pattern ] || [] )
				);
			} );

			vi.mocked( fs ).readJson.mockResolvedValue( {} );

			await updateDependencies( {
				packagesDirectory: 'packages'
			} );

			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/package.json' );
			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-foo/package.json' );
			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-bar/package.json' );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/package.json',
				expect.any( Object ),
				expect.any( Object )
			);
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/packages/ckeditor5-foo/package.json',
				expect.any( Object ),
				expect.any( Object )
			);
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/packages/ckeditor5-bar/package.json',
				expect.any( Object ),
				expect.any( Object )
			);
		} );

		it( 'should allow filtering out packages that do not pass the `packagesDirectoryFilter` callback', async () => {
			vi.mocked( glob ).mockImplementation( patterns => {
				const paths = {
					'package.json': [
						'/work/project/package.json'
					],
					'packages/*/package.json': [
						'/work/project/packages/ckeditor5-ignore-me/package.json',
						'/work/project/packages/ckeditor5-bar/package.json'
					]
				};

				return Promise.resolve(
					patterns.flatMap( pattern => paths[ pattern ] || [] )
				);
			} );

			vi.mocked( fs ).readJson.mockResolvedValue( {} );

			const directoriesToSkip = [
				'ckeditor5-ignore-me'
			];

			await updateDependencies( {
				version: '^38.0.0',
				packagesDirectory: 'packages',
				packagesDirectoryFilter: packageJsonPath => {
					return !directoriesToSkip.some( item => {
						return upath.dirname( packageJsonPath ).endsWith( item );
					} );
				}
			} );

			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/package.json' );
			expect( vi.mocked( fs ).readJson ).toHaveBeenCalledWith( '/work/project/packages/ckeditor5-bar/package.json' );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/package.json',
				expect.any( Object ),
				expect.any( Object )
			);
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/packages/ckeditor5-bar/package.json',
				expect.any( Object ),
				expect.any( Object )
			);
		} );

		it( 'should update eligible dependencies from the `dependencies` key', async () => {
			vi.mocked( glob ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readJson.mockResolvedValue( {
				dependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback
			} );

			expect( shouldUpdateVersionCallback ).toHaveBeenCalledTimes( 4 );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-engine' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-enter' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-essentials' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( 'lodash-es' );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/package.json',
				{
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				},
				expect.any( Object )
			);
		} );

		it( 'should update eligible dependencies from the `devDependencies` key', async () => {
			vi.mocked( glob ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readJson.mockResolvedValue( {
				devDependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback
			} );

			expect( shouldUpdateVersionCallback ).toHaveBeenCalledTimes( 4 );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-engine' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-enter' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-essentials' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( 'lodash-es' );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/package.json',
				{
					devDependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				},
				expect.any( Object )
			);
		} );

		it( 'should update eligible dependencies from the `peerDependencies` key', async () => {
			vi.mocked( glob ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readJson.mockResolvedValue( {
				peerDependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback
			} );

			expect( shouldUpdateVersionCallback ).toHaveBeenCalledTimes( 4 );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-engine' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-enter' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( '@ckeditor/ckeditor5-essentials' );
			expect( shouldUpdateVersionCallback ).toHaveBeenCalledWith( 'lodash-es' );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/package.json',
				{
					peerDependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				},
				expect.any( Object )
			);
		} );

		it( 'should not update any package if `shouldUpdateVersionCallback` callback resolves falsy value', async () => {
			vi.mocked( glob ).mockResolvedValue( [ '/work/project/package.json' ] );

			vi.mocked( fs ).readJson.mockResolvedValue( {
				dependencies: {
					'@ckeditor/ckeditor5-engine': '^37.0.0',
					'@ckeditor/ckeditor5-enter': '^37.0.0',
					'@ckeditor/ckeditor5-essentials': '^37.0.0',
					'lodash-es': '^4.17.15'
				}
			} );

			await updateDependencies( {
				version: '^38.0.0',
				shouldUpdateVersionCallback: () => false
			} );

			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs ).writeJson ).toHaveBeenCalledWith(
				'/work/project/package.json',
				{
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				},
				expect.any( Object )
			);
		} );
	} );
} );
