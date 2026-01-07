/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import getPackageJson, { type PackageJson } from '../../src/workspaces/getpackagejson.js';

vi.mock( 'fs' );
vi.mock( 'fs/promises' );

describe( 'getPackageJson()', () => {
	describe( 'async=false', () => {
		it( 'should read the package.json when cwd is a directory path (missing `async`)', () => {
			const cwd = '/my/package/dir';
			const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

			vi.mocked( fs.readFileSync ).mockReturnValue( JSON.stringify( fakePackageJson ) );

			const result = getPackageJson( cwd );

			expect( result ).toEqual( fakePackageJson );
			expect( fs.readFileSync ).toHaveBeenCalledWith( '/my/package/dir/package.json', 'utf-8' );
		} );

		it( 'should read the package.json when cwd is a directory path (`async=false`)', () => {
			const cwd = '/my/package/dir';
			const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

			vi.mocked( fs.readFileSync ).mockReturnValue( JSON.stringify( fakePackageJson ) );

			const result = getPackageJson( cwd, { async: false } );

			expect( result ).toEqual( fakePackageJson );
			expect( fs.readFileSync ).toHaveBeenCalledWith( '/my/package/dir/package.json', 'utf-8' );
		} );

		it( 'should throw an error when readFileSync fails (missing `async`)', () => {
			const cwd = '/my/package/dir';

			vi.mocked( fs.readFileSync ).mockImplementation( () => {
				throw new Error( 'Failed to read package.json' );
			} );

			expect( () => {
				getPackageJson( cwd );
			} ).toThrowError( 'Failed to read package.json' );
		} );

		it( 'should throw an error when readFileSync fails (`async=false`)', () => {
			const cwd = '/my/package/dir';

			vi.mocked( fs.readFileSync ).mockImplementation( () => {
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

			vi.mocked( fsPromise.readFile ).mockResolvedValueOnce( JSON.stringify( fakePackageJson ) );

			const result = await getPackageJson( cwd, { async: true } );

			expect( result ).toEqual( fakePackageJson );
			expect( fsPromise.readFile ).toHaveBeenCalledWith( '/my/package/dir/package.json', 'utf-8' );
		} );

		it( 'should throw an error when readFile fails', async () => {
			const cwd = '/my/package/dir';

			vi.mocked( fsPromise.readFile ).mockRejectedValueOnce( new Error( 'Failed to read package.json' ) );

			await expect( getPackageJson( cwd, { async: true } ) ).rejects.toThrowError( 'Failed to read package.json' );
		} );
	} );
} );
