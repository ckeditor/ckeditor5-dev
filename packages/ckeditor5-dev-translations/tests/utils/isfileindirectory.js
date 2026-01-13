/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import isFileInDirectory from '../../lib/utils/isfileindirectory.js';

describe( 'isFileInDirectory()', () => {
	it( 'should be a function', () => {
		expect( isFileInDirectory ).toBeInstanceOf( Function );
	} );

	it( 'should properly calculate if the file path is inside the defined directory', () => {
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', '/absolute/path/to/directory' ) ).toEqual( true );
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', '/absolute/path/to/directory/' ) ).toEqual( true );

		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', '/another/path/to/directory' ) ).toEqual( false );
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', '/another/path/to/directory/' ) ).toEqual( false );
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', '/absolute/path/to/dir' ) ).toEqual( false );
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', '/absolute/path/to/dir/' ) ).toEqual( false );
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', 'directory' ) ).toEqual( false );
		expect( isFileInDirectory( '/absolute/path/to/directory/src/file.ts', 'directory/' ) ).toEqual( false );
	} );
} );
