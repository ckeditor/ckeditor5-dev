/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import getDirectories from '../../src/tools/getdirectories.js';

vi.mock( 'fs' );

describe( 'getDirectories()', () => {
	it( 'should get directories in specified path', () => {
		const directories = [ 'dir1', 'dir2', 'dir3' ];

		vi.mocked( fs ).readdirSync.mockReturnValue( directories as any );
		vi.mocked( fs ).statSync.mockReturnValue( {
			isDirectory: () => {
				return true;
			}
		} as any );

		const dirPath = 'path';

		getDirectories( dirPath );

		expect( vi.mocked( fs ).readdirSync ).toHaveBeenCalledExactlyOnceWith( dirPath );
		expect( vi.mocked( fs ).statSync ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fs ).statSync ).toHaveBeenCalledWith( path.join( dirPath, directories[ 0 ]! ) );
		expect( vi.mocked( fs ).statSync ).toHaveBeenCalledWith( path.join( dirPath, directories[ 1 ]! ) );
		expect( vi.mocked( fs ).statSync ).toHaveBeenCalledWith( path.join( dirPath, directories[ 2 ]! ) );
	} );
} );
