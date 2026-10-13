/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { compare, inline, plural } from '../../src/utils/strings.js';

describe( 'strings', () => {
	it( 'compare() compares by code units', () => {
		expect( compare( 'a', 'a' ) ).toBe( 0 );
		expect( compare( 'B', 'a' ) ).toBe( -1 );
		expect( compare( 'b', 'a' ) ).toBe( 1 );
	} );

	it( 'inline() joins the lines of a text', () => {
		expect( inline( ' Line one.\n\n  Line two. \n' ) ).toBe( 'Line one. Line two.' );
	} );

	it( 'plural() adds "s" unless the count is 1', () => {
		expect( plural( 1, 'unit' ) ).toBe( 'unit' );
		expect( plural( 0, 'unit' ) ).toBe( 'units' );
		expect( plural( 2, 'unit' ) ).toBe( 'units' );
	} );
} );
