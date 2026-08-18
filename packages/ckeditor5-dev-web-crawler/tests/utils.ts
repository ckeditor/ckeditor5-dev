/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { areSameUrl, getBaseUrl, isUrlValid, toArray } from '../src/utils.js';

describe( 'toArray()', () => {
	it( 'wraps a non-array value', () => {
		expect( toArray( 'ckeditor' ) ).toEqual( [ 'ckeditor' ] );
	} );

	it( 'returns the same array instance for arrays', () => {
		const input = [ 'a', 'b' ];

		expect( toArray( input ) ).toBe( input );
	} );
} );

describe( 'getBaseUrl()', () => {
	it( 'strips the hash and query string from URL', () => {
		expect( getBaseUrl( 'https://ckeditor.com/docs/guide?foo=1#section' ) )
			.toBe( 'https://ckeditor.com/docs/guide' );
	} );
} );

describe( 'isUrlValid()', () => {
	it( 'accepts HTTP and HTTPS protocols', () => {
		expect( isUrlValid( 'http://ckeditor.com' ) ).toBe( true );
		expect( isUrlValid( 'https://ckeditor.com' ) ).toBe( true );
	} );

	it( 'rejects non-HTTP protocols and malformed URLs', () => {
		expect( isUrlValid( 'ftp://ckeditor.com' ) ).toBe( false );
		expect( isUrlValid( 'not a valid url' ) ).toBe( false );
	} );
} );

describe( 'areSameUrl()', () => {
	it( 'compares normalized URLs', () => {
		expect( areSameUrl( 'https://ckeditor.com', 'https://ckeditor.com/' ) ).toBe( true );
	} );

	it( 'returns false for different valid URLs', () => {
		expect( areSameUrl( 'https://ckeditor.com/docs', 'https://ckeditor.com/blog' ) ).toBe( false );
	} );

	it( 'falls back to plain string comparison for invalid URLs', () => {
		expect( areSameUrl( 'not a url', 'not a url' ) ).toBe( true );
		expect( areSameUrl( 'not a url', 'another invalid' ) ).toBe( false );
	} );
} );
