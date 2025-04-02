/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { removeEmptyDirs } from '../../src/utils/removeemptydirs.js';
import fs from 'fs-extra';
import upath from 'upath';

vi.mock( 'fs-extra' );

describe( 'removeEmptyDirs', () => {
	const mockDir = '/some/dir';

	it( 'does nothing if the directory does not exist', async () => {
		// Setup the mock implementation for this test case
		vi.mocked( fs.pathExists ).mockResolvedValue( false as any );

		await removeEmptyDirs( mockDir );

		expect( fs.readdir ).not.toHaveBeenCalled();
		expect( fs.rmdir ).not.toHaveBeenCalled();
	} );

	it( 'removes an empty directory', async () => {
		// Setup the mock implementations for this test case
		vi.mocked( fs.pathExists ).mockResolvedValue( true as any );
		vi.mocked( fs.readdir ).mockResolvedValue( [] as any );
		vi.mocked( fs.rmdir ).mockResolvedValue( undefined );

		await removeEmptyDirs( mockDir );

		expect( fs.rmdir ).toHaveBeenCalledWith( mockDir );
	} );

	it( 'recursively removes empty subdirectories', async () => {
		const subDir = upath.join( mockDir, 'subdir' );

		// Setup the mock implementations for this test case
		vi.mocked( fs.pathExists ).mockResolvedValue( true as any );
		vi.mocked( fs.readdir )
			.mockResolvedValueOnce( [ 'subdir' ] as any ) // First call: `mockDir` contains `subdir`
			.mockResolvedValue( [] as any ); // Other calls: `subdir` is empty
		vi.mocked( fs.stat ).mockResolvedValue( { isDirectory: () => true } as any );
		vi.mocked( fs.rmdir ).mockResolvedValue( undefined );

		await removeEmptyDirs( mockDir );

		expect( fs.rmdir ).toHaveBeenCalledWith( subDir );
		expect( fs.rmdir ).toHaveBeenCalledWith( mockDir );
	} );

	it( 'does not remove a non-empty directory', async () => {
		// Setup the mock implementations for this test case
		vi.mocked( fs.pathExists ).mockResolvedValue( true as any );
		vi.mocked( fs.readdir ).mockResolvedValue( [ 'file.txt' ] as any );
		vi.mocked( fs.stat ).mockResolvedValue( { isDirectory: () => false } as any );

		await removeEmptyDirs( mockDir );

		expect( fs.rmdir ).not.toHaveBeenCalled();
	} );
} );
