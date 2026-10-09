/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { hash, normalise } from '../../src/utils/text.js';

describe( 'normalise()', () => {
	it( 'folds whitespace and trims the text', () => {
		expect( normalise( '  Foo \n\t bar  ' ) ).toBe( 'Foo bar' );
	} );

	it( 'decodes named entities', () => {
		expect( normalise( 'A&nbsp;&amp;&nbsp;B &lt;&gt;&quot;&apos; &copy;' ) ).toBe( 'A & B <>"\' ©' );
	} );

	it( 'decodes named entities case-sensitively, as HTML does', () => {
		expect( normalise( '&NBSP;&Amp;' ) ).toBe( '&NBSP;&Amp;' );
	} );

	it( 'folds typographic entities', () => {
		expect( normalise( '&mdash;&ndash;&minus;&hellip;&lsquo;&rsquo;&ldquo;&rdquo;' ) ).toBe( '---...\'\'""' );
	} );

	it( 'leaves unknown entities and entities without a semicolon as they are', () => {
		expect( normalise( '&unknown; &copy &constructor; &toString;' ) ).toBe( '&unknown; &copy &constructor; &toString;' );
	} );

	it( 'decodes decimal and hexadecimal entities', () => {
		expect( normalise( '&#65;&#x42;&#X43;' ) ).toBe( 'ABC' );
	} );

	it( 'decodes numeric entities outside of the Unicode range to the replacement character, as HTML does', () => {
		expect( normalise( '&#x110000;' ) ).toBe( '\uFFFD' );
	} );

	it( 'folds typographic quotes, dashes and ellipses', () => {
		expect( normalise( '‘a’ “b” – — − … ‚‛′„‟″‐‑‒―' ) )
			.toBe( '\'a\' "b" - - - ... \'\'\'"""----' );
	} );
} );

describe( 'hash()', () => {
	it( 'returns a stable 12-character hexadecimal hash', () => {
		expect( hash( 'foo' ) ).toBe( '2c26b46b68ff' );
		expect( hash( 'foo' ) ).toMatch( /^[0-9a-f]{12}$/ );
	} );

	it( 'returns different hashes for different texts', () => {
		expect( hash( 'foo' ) ).not.toBe( hash( 'bar' ) );
	} );
} );
