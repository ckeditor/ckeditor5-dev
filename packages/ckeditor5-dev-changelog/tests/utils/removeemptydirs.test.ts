/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeEmptyDirs } from '../../src/utils/removeemptydirs.js';
import fsExtra from 'fs-extra';
import fs from 'fs/promises';
import upath from 'upath';

vi.mock( 'fs-extra' );
vi.mock( 'fs/promises' );

describe( 'removeEmptyDirs', () => {
	const mockDir = '/some/dir';

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'does nothing if the directory does not exist', async () => {
		vi.mocked( fsExtra.existsSync ).mockReturnValue( false );

		await removeEmptyDirs( mockDir );

		expect( fs.readdir ).not.toHaveBeenCalled();
		expect( fs.rmdir ).not.toHaveBeenCalled();
	} );

	it( 'removes an empty directory', async () => {
		vi.mocked( fsExtra.existsSync ).mockReturnValue( true );
		vi.mocked( fs.readdir ).mockResolvedValue( [] );

		await removeEmptyDirs( mockDir );

		expect( fs.rmdir ).toHaveBeenCalledWith( mockDir );
	} );

	it( 'recursively removes empty subdirectories', async () => {
		const subDir = upath.join( mockDir, 'subdir' );

		vi.mocked( fsExtra.existsSync ).mockReturnValue( true );
		vi.mocked( fs.readdir )
			.mockResolvedValueOnce( [ 'subdir' as any ] ) // First call: `mockDir` contains `subdir`
			.mockResolvedValue( [] ); // Second call: `subdir` is empty

		vi.mocked( fs.stat ).mockResolvedValue( { isDirectory: () => true } as any );

		await removeEmptyDirs( mockDir );

		expect( fs.rmdir ).toHaveBeenCalledWith( subDir );
		expect( fs.rmdir ).toHaveBeenCalledWith( mockDir );
	} );

	it( 'does not remove a non-empty directory', async () => {
		vi.mocked( fsExtra.existsSync ).mockReturnValue( true );
		vi.mocked( fs.readdir ).mockResolvedValue( [ 'file.txt' as any ] );
		vi.mocked( fs.stat ).mockResolvedValue( { isDirectory: () => false } as any );

		await removeEmptyDirs( mockDir );

		expect( fs.rmdir ).not.toHaveBeenCalled();
	} );
} );
