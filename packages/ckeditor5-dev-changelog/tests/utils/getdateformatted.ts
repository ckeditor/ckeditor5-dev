/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getDateFormatted } from '../../src/utils/getdateformatted.js';
import { describe, it, expect } from 'vitest';

describe( 'getDateFormatted()', () => {
	it( 'should format a valid date correctly', () => {
		expect( getDateFormatted( '2023-12-25' ) ).toBe( 'December 25, 2023' );
		expect( getDateFormatted( '2024-01-01' ) ).toBe( 'January 1, 2024' );
		expect( getDateFormatted( '1999-07-04' ) ).toBe( 'July 4, 1999' );
	} );

	it( 'should throw an error for invalid dates', () => {
		expect( () => getDateFormatted( '2023-02-30' ) ).toThrow();
		expect( () => getDateFormatted( 'abcd-ef-gh' ) ).toThrow();
		expect( () => getDateFormatted( '' ) ).toThrow();
		expect( () => getDateFormatted( '2024-13-01' ) ).toThrow();
	} );

	it( 'should throw an error for missing input', () => {
		expect( () => getDateFormatted( undefined as unknown as string ) ).toThrow();
		expect( () => getDateFormatted( null as unknown as string ) ).toThrow();
	} );
} );
