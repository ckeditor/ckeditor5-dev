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

	it( 'decodes named entities, case-insensitively', () => {
		expect( normalise( 'A&nbsp;&amp;&NBSP;B &lt;&gt;&quot;&apos;' ) ).toBe( 'A & B <>"\'' );
	} );

	it( 'folds typographic entities', () => {
		expect( normalise( '&mdash;&ndash;&minus;&hellip;&lsquo;&rsquo;&ldquo;&rdquo;' ) ).toBe( '---...\'\'""' );
	} );

	it( 'leaves unknown entities as they are', () => {
		expect( normalise( '&unknown; &copy;' ) ).toBe( '&unknown; &copy;' );
	} );

	it( 'decodes decimal and hexadecimal entities', () => {
		expect( normalise( '&#65;&#x42;&#X43;' ) ).toBe( 'ABC' );
	} );

	it( 'leaves numeric entities outside of the Unicode range as they are', () => {
		expect( normalise( '&#x110000;' ) ).toBe( '&#x110000;' );
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
