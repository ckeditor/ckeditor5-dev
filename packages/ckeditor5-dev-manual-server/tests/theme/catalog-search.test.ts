/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import { filterEntries, findMatchOffsets } from '../../theme/catalog-search.js';

describe( 'filterEntries()', () => {
	const entries = [
		{
			href: '/packages/ckeditor5-foo/tests/manual/basic.manual.html',
			packageName: 'ckeditor5-foo',
			slug: 'basic'
		},
		{
			href: '/packages/ckeditor5-foo/tests/manual/nested/advanced.manual.html',
			packageName: 'ckeditor5-foo',
			slug: 'nested/advanced'
		},
		{
			href: '/packages/ckeditor5-bar/tests/manual/basic.manual.html',
			packageName: 'ckeditor5-bar',
			slug: 'basic'
		}
	];

	test( 'returns all entries for an empty query', () => {
		expect( filterEntries( entries, '' ) ).to.equal( entries );
	} );

	test( 'returns all tests belonging to a matching package', () => {
		expect( filterEntries( entries, 'foo' ) ).to.deep.equal( entries.slice( 0, 2 ) );
	} );

	test( 'returns tests with a matching slug, including nested slugs', () => {
		expect( filterEntries( entries, 'advanced' ) ).to.deep.equal( [ entries[ 1 ] ] );
	} );

	test( 'returns no entries when the query does not match', () => {
		expect( filterEntries( entries, 'missing' ) ).to.deep.equal( [] );
	} );

	test( 'preserves original entry objects and their additional fields', () => {
		const [ result ] = filterEntries( entries, 'advanced' );

		expect( result ).to.equal( entries[ 1 ] );
		expect( result!.href ).to.equal( '/packages/ckeditor5-foo/tests/manual/nested/advanced.manual.html' );
	} );

	test( 'ranks exact, prefix and partial package matches before slug-only matches', () => {
		const entries = [
			{ packageName: 'ckeditor5-bar', slug: 'foo-test' },
			{ packageName: 'ckeditor5-extra-foo', slug: 'unrelated' },
			{ packageName: 'ckeditor5-foo-extra', slug: 'unrelated' },
			{ packageName: 'ckeditor5-foo', slug: 'unrelated' }
		];

		expect( filterEntries( entries, 'foo' ) ).to.deep.equal( [ entries[ 3 ], entries[ 2 ], entries[ 1 ], entries[ 0 ] ] );
	} );

	test( 'ranks slug-only package matches by the number of matching tests', () => {
		const entries = [
			{ packageName: 'ckeditor5-bar', slug: 'foo-test' },
			{ packageName: 'ckeditor5-baz', slug: 'foo-basic' },
			{ packageName: 'ckeditor5-baz', slug: 'nested/foo-advanced' }
		];

		expect( filterEntries( entries, 'foo' ) ).to.deep.equal( [ entries[ 1 ], entries[ 2 ], entries[ 0 ] ] );
	} );

	test( 'ranks exact package names without the ckeditor5 prefix', () => {
		const entries = [
			{ packageName: 'bar', slug: 'foo-test' },
			{ packageName: 'foo', slug: 'basic' }
		];

		expect( filterEntries( entries, 'foo' ) ).to.deep.equal( [ entries[ 1 ], entries[ 0 ] ] );
	} );

	test( 'preserves package and test order when ranking signals are equal', () => {
		const entries = [
			{ packageName: 'ckeditor5-foo', slug: 'nested/zeta' },
			{ packageName: 'ckeditor5-foo', slug: 'nested/alpha' },
			{ packageName: 'ckeditor5-bar', slug: 'nested/zeta' },
			{ packageName: 'ckeditor5-bar', slug: 'nested/alpha' }
		];

		expect( filterEntries( entries, 'nested' ) ).to.deep.equal( entries );
	} );
} );

describe( 'findMatchOffsets()', () => {
	test( 'finds matches at the beginning, middle and end of text', () => {
		expect( findMatchOffsets( 'foo-prefix-foo-suffix-foo', 'foo' ) ).to.deep.equal( [
			{ start: 0, end: 3 },
			{ start: 11, end: 14 },
			{ start: 22, end: 25 }
		] );
	} );

	test( 'finds matches case-insensitively while preserving original offsets', () => {
		expect( findMatchOffsets( 'CKEditor5-ckeditor5', 'ckeditor5' ) ).to.deep.equal( [
			{ start: 0, end: 9 },
			{ start: 10, end: 19 }
		] );
	} );

	test( 'treats regular expression characters literally', () => {
		expect( findMatchOffsets( 'foo.[bar]-foo.[bar]', '.[bar]' ) ).to.deep.equal( [
			{ start: 3, end: 9 },
			{ start: 13, end: 19 }
		] );
	} );

	test( 'returns no matches for an empty or absent query', () => {
		expect( findMatchOffsets( 'foo', '' ) ).to.deep.equal( [] );
		expect( findMatchOffsets( 'foo', 'bar' ) ).to.deep.equal( [] );
	} );

	test( 'finds adjacent matches', () => {
		expect( findMatchOffsets( 'foofoo', 'foo' ) ).to.deep.equal( [
			{ start: 0, end: 3 },
			{ start: 3, end: 6 }
		] );
	} );

	test( 'returns non-overlapping matches', () => {
		expect( findMatchOffsets( 'aaaa', 'aa' ) ).to.deep.equal( [
			{ start: 0, end: 2 },
			{ start: 2, end: 4 }
		] );
	} );
} );
