/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'fs-extra';
import { getPackageJson } from '../../src/utils/getpackagejson.js';
import type { PackageJson } from '../../src/types.js';

vi.mock( 'fs-extra' );

describe( 'getPackageJson', () => {
	it( 'should read the package.json when cwd is a directory path', async () => {
		const cwd = '/my/package/dir';
		const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

		vi.mocked( fs.readJson ).mockResolvedValueOnce( fakePackageJson );

		const result = await getPackageJson( cwd );

		expect( result ).toEqual( fakePackageJson );
		expect( fs.readJson ).toHaveBeenCalledWith( '/my/package/dir/package.json' );
	} );

	it( 'should throw an error when readJson fails', async () => {
		const cwd = '/my/package/dir';

		vi.mocked( fs.readJson ).mockRejectedValueOnce( new Error( 'Failed to read package.json' ) );

		await expect( getPackageJson( cwd ) ).rejects.toThrowError( 'Failed to read package.json' );
	} );
} );
