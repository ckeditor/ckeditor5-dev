/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'fs-extra';
import getPackageJson, { type PackageJson } from '../../src/workspaces/getpackagejson.js';

vi.mock( 'fs-extra' );

describe( 'getPackageJson()', () => {
	describe( 'async=false', () => {
		it( 'should read the package.json when cwd is a directory path (missing `async`)', () => {
			const cwd = '/my/package/dir';
			const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

			vi.mocked( fs.readJsonSync ).mockReturnValue( fakePackageJson );

			const result = getPackageJson( cwd );

			expect( result ).toEqual( fakePackageJson );
			expect( fs.readJsonSync ).toHaveBeenCalledWith( '/my/package/dir/package.json' );
		} );

		it( 'should read the package.json when cwd is a directory path (`async=false`)', () => {
			const cwd = '/my/package/dir';
			const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

			vi.mocked( fs.readJsonSync ).mockReturnValue( fakePackageJson );

			const result = getPackageJson( cwd, { async: false } );

			expect( result ).toEqual( fakePackageJson );
			expect( fs.readJsonSync ).toHaveBeenCalledWith( '/my/package/dir/package.json' );
		} );

		it( 'should throw an error when readJsonSync fails (missing `async`)', () => {
			const cwd = '/my/package/dir';

			vi.mocked( fs.readJsonSync ).mockImplementation( () => {
				throw new Error( 'Failed to read package.json' );
			} );

			expect( () => {
				getPackageJson( cwd );
			} ).toThrowError( 'Failed to read package.json' );
		} );

		it( 'should throw an error when readJsonSync fails (`async=false`)', () => {
			const cwd = '/my/package/dir';

			vi.mocked( fs.readJsonSync ).mockImplementation( () => {
				throw new Error( 'Failed to read package.json' );
			} );

			expect( () => {
				getPackageJson( cwd, { async: false } );
			} ).toThrowError( 'Failed to read package.json' );
		} );
	} );

	describe( 'async=true', () => {
		it( 'should read the package.json when cwd is a directory path', async () => {
			const cwd = '/my/package/dir';
			const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

			vi.mocked( fs.readJson ).mockResolvedValueOnce( fakePackageJson );

			const result = await getPackageJson( cwd, { async: true } );

			expect( result ).toEqual( fakePackageJson );
			expect( fs.readJson ).toHaveBeenCalledWith( '/my/package/dir/package.json' );
		} );

		it( 'should throw an error when readJson fails', async () => {
			const cwd = '/my/package/dir';

			vi.mocked( fs.readJson ).mockRejectedValueOnce( new Error( 'Failed to read package.json' ) );

			await expect( getPackageJson( cwd, { async: true } ) ).rejects.toThrowError( 'Failed to read package.json' );
		} );
	} );
} );
