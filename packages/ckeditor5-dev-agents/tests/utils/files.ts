/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { isOutside, readIfExists } from '../../src/utils/files.js';

describe( 'files', () => {
	describe( 'readIfExists()', () => {
		it( 'returns what the read returns', async () => {
			expect( await readIfExists( async () => 'content' ) ).toBe( 'content' );
		} );

		it( 'returns null when the file does not exist', async () => {
			expect( await readIfExists( () => Promise.reject( Object.assign( new Error( 'Missing.' ), { code: 'ENOENT' } ) ) ) ).toBeNull();
		} );

		it( 'rethrows other errors', async () => {
			const error = Object.assign( new Error( 'Denied.' ), { code: 'EACCES' } );

			await expect( readIfExists( () => Promise.reject( error ) ) ).rejects.toBe( error );
		} );
	} );

	describe( 'isOutside()', () => {
		it( 'detects paths that leave the directory', () => {
			expect( isOutside( '..' ) ).toBe( true );
			expect( isOutside( '../a.md' ) ).toBe( true );
			expect( isOutside( '/a.md' ) ).toBe( true );
		} );

		it( 'accepts paths inside the directory, including names that start with two dots', () => {
			expect( isOutside( '.' ) ).toBe( false );
			expect( isOutside( 'a/b.md' ) ).toBe( false );
			expect( isOutside( '..notes.md' ) ).toBe( false );
		} );
	} );
} );
