/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../../src/types.js';
import { normalizeEntry } from '../../src/utils/normalizeentry.js';
import { describe, it, expect } from 'vitest';

function createEntry( data: Record<string, any> ): ParsedFile {
	return {
		content: 'Test content',
		data: {
			...data
		},
		changesetPath: 'path/to/changeset',
		gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
		skipLinks: false
	};
}

describe( 'normalizeEntry()', () => {
	describe( 'type normalization', () => {
		it( 'should capitalize the type', () => {
			const entry = createEntry( { type: 'feature' } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.type ).toBe( 'Feature' );
		} );

		it( 'should convert "Fixes" to "Fix"', () => {
			const entry = createEntry( { type: 'fixes' } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.type ).toBe( 'Fix' );
		} );

		it( 'should maintain other capitalized types', () => {
			const entry = createEntry( { type: 'other' } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.type ).toBe( 'Other' );
		} );
	} );

	describe( 'breaking change normalization', () => {
		it( 'should normalize boolean value to boolean', () => {
			const entry = createEntry( { 'breaking-change': true } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data[ 'breaking-change' ] ).toBe( true );
		} );

		it( 'should normalize text to be lowercase', () => {
			const entry = createEntry( { 'breaking-change': 'TEST123' } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data[ 'breaking-change' ] ).toBe( 'test123' );
		} );
	} );

	describe( 'scope normalization', () => {
		it( 'should normalize scope to lowercase', () => {
			const entry = createEntry( { scope: [ 'EngIne', 'UI' ] } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.scope ).toEqual( [ 'engine', 'ui' ] );
		} );

		it( 'should return undefined when scope is not provided', () => {
			const entry = createEntry( {} );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.scope ).toBeUndefined();
		} );
	} );

	describe( 'other fields normalization', () => {
		it( 'should maintain closes field', () => {
			const closesValue = [ 123, '456' ];
			const entry = createEntry( { closes: closesValue } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.closes ).toEqual( [ '123', '456' ] );
		} );

		it( 'should maintain see field', () => {
			const seeValue = [ 'https://example.com', 'https://github.com/ckeditor/ckeditor5/issues/123' ];
			const entry = createEntry( { see: seeValue } );

			const normalizedEntry = normalizeEntry( entry );

			expect( normalizedEntry.data.see ).toEqual( seeValue );
		} );
	} );
} );
