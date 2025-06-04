/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../../src/types.js';
import { normalizeEntry } from '../../src/utils/normalizeentry.js';
import { describe, it, expect, vi } from 'vitest';

vi.mock( '../../src/constants.js', () => {
	return {
		TYPES: [
			{ name: 'Feature' },
			{ name: 'Other' },
			{ name: 'Fix', aliases: [ 'Fixes' ] },
			{ name: 'Major breaking change', aliases: [ 'Major' ] },
			{ name: 'Minor breaking change', aliases: [ 'Minor' ] },
			{ name: 'Breaking change', aliases: [ 'Breaking' ] }
		]
	};
} );

function createEntry( data: Record<string, any> ): ParsedFile {
	return {
		content: 'Test content',
		data: {
			...data
		},
		changesetPath: 'path/to/changeset',
		gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
		shouldSkipLinks: false
	};
}

describe( 'normalizeEntry()', () => {
	describe( 'type normalization', () => {
		it( 'should capitalize the type', () => {
			const entry = createEntry( { type: 'feature' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.type ).toBe( 'Feature' );
		} );

		it( 'should maintain other capitalized types', () => {
			const entry = createEntry( { type: 'other' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.type ).toBe( 'Other' );
		} );

		it( 'should cast minor and major breaking changes in a single package to generic one', () => {
			const entry1 = createEntry( { type: 'Major breaking change' } );
			const entry2 = createEntry( { type: 'Minor breaking change' } );

			const normalizedEntry1 = normalizeEntry( entry1, true );
			const normalizedEntry2 = normalizeEntry( entry2, true );

			expect( normalizedEntry1.data.type ).toBe( 'Breaking change' );
			expect( normalizedEntry2.data.type ).toBe( 'Breaking change' );
		} );
	} );

	describe( 'scope normalization', () => {
		it( 'should normalize scope to lowercase', () => {
			const entry = createEntry( { scope: [ 'EngIne', 'UI' ] } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.scope ).toEqual( [ 'engine', 'ui' ] );
		} );

		it( 'should return empty array when scope is not provided', () => {
			const entry = createEntry( {} );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.scope ).toHaveLength( 0 );
		} );
	} );

	describe( 'other fields normalization', () => {
		it( 'should maintain closes field', () => {
			const closesValue = [ 123, '456' ];
			const entry = createEntry( { closes: closesValue } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.closes ).toEqual( [ '123', '456' ] );
		} );

		it( 'should maintain see field', () => {
			const seeValue = [ 'https://example.com', 'https://github.com/ckeditor/ckeditor5/issues/123' ];
			const entry = createEntry( { see: seeValue } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.see ).toEqual( seeValue );
		} );
	} );
} );
