/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import getRepositoryUrl from '../../src/workspaces/getrepositoryurl.js';
import getPackageJson from '../../src/workspaces/getpackagejson.js';

vi.mock( '../../src/workspaces/getpackagejson' );

describe( 'getRepositoryUrl()', () => {
	const mockCwd = '/test/cwd';
	const mockPackageName = 'test-package';

	describe( 'async=false', () => {
		it( 'should extract repository URL from string format (missing `async`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'https://github.com/ckeditor/ckeditor5.git'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( getPackageJson ).toHaveBeenCalledWith( mockCwd );
			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should extract repository URL from string format (`async=false`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'https://github.com/ckeditor/ckeditor5.git'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( getPackageJson ).toHaveBeenCalledWith( mockCwd );
			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should extract repository URL from object format (missing `async`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: {
					type: 'git',
					url: 'https://github.com/ckeditor/ckeditor5.git'
				}
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( getPackageJson ).toHaveBeenCalledWith( mockCwd );
			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should extract repository URL from object format (`async=false`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: {
					type: 'git',
					url: 'https://github.com/ckeditor/ckeditor5.git'
				}
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( getPackageJson ).toHaveBeenCalledWith( mockCwd );
			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should remove /issues suffix from repository URL (missing `async`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'https://github.com/ckeditor/ckeditor5/issues'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should remove /issues suffix from repository URL (`async=false`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'https://github.com/ckeditor/ckeditor5/issues'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should remove git+ prefix from repository URL (missing `async`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'git+https://github.com/ckeditor/ckeditor5'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should remove git+ prefix from repository URL (`async=false`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'git+https://github.com/ckeditor/ckeditor5'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			const result = getRepositoryUrl( mockCwd );

			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should throw error when repository is missing (missing `async`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			expect( () => {
				getRepositoryUrl( mockCwd );
			} ).toThrow(
				`The package.json for "${ mockPackageName }" must contain the "repository" property.`
			);
		} );

		it( 'should throw error when repository is missing (`async=false`)', () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0'
			};
			vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

			expect( () => {
				getRepositoryUrl( mockCwd );
			} ).toThrow(
				`The package.json for "${ mockPackageName }" must contain the "repository" property.`
			);
		} );
	} );

	describe( 'async=true', () => {
		it( 'should extract repository URL from string format', async () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'https://github.com/ckeditor/ckeditor5.git'
			};
			vi.mocked( getPackageJson ).mockResolvedValue( mockPackageJson );

			const result = await getRepositoryUrl( mockCwd, { async: true } );

			expect( getPackageJson ).toHaveBeenCalledWith( mockCwd, { async: true } );
			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should extract repository URL from object format', async () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: {
					type: 'git',
					url: 'https://github.com/ckeditor/ckeditor5.git'
				}
			};
			vi.mocked( getPackageJson ).mockResolvedValue( mockPackageJson );

			const result = await getRepositoryUrl( mockCwd, { async: true } );

			expect( getPackageJson ).toHaveBeenCalledWith( mockCwd, { async: true } );
			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should remove /issues suffix from repository URL', async () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'https://github.com/ckeditor/ckeditor5/issues'
			};
			vi.mocked( getPackageJson ).mockResolvedValue( mockPackageJson );

			const result = await getRepositoryUrl( mockCwd, { async: true } );

			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should remove git+ prefix from repository URL', async () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0',
				repository: 'git+https://github.com/ckeditor/ckeditor5'
			};
			vi.mocked( getPackageJson ).mockResolvedValue( mockPackageJson );

			const result = await getRepositoryUrl( mockCwd, { async: true } );

			expect( result ).toBe( 'https://github.com/ckeditor/ckeditor5' );
		} );

		it( 'should throw error when repository is missing', async () => {
			const mockPackageJson = {
				name: mockPackageName,
				version: '1.0.0'
			};
			vi.mocked( getPackageJson ).mockResolvedValue( mockPackageJson );

			await expect( getRepositoryUrl( mockCwd, { async: true } ) ).rejects.toThrow(
				`The package.json for "${ mockPackageName }" must contain the "repository" property.`
			);
		} );
	} );
} );
