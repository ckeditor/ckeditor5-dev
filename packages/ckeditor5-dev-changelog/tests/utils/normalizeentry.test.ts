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

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.typeNormalized ).toBe( 'Feature' );
		} );

		it( 'should convert "Fixes" to "Fix"', () => {
			const entry = createEntry( { type: 'fixes' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.typeNormalized ).toBe( 'Fix' );
		} );

		it( 'should maintain other capitalized types', () => {
			const entry = createEntry( { type: 'other' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.typeNormalized ).toBe( 'Other' );
		} );
	} );

	describe( 'breaking change normalization for single package', () => {
		it( 'should normalize "true" to boolean true for single package', () => {
			const entry = createEntry( { 'breaking-change': 'true' } );

			const normalizedEntry = normalizeEntry( entry, true );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( true );
		} );

		it( 'should normalize "MINOR" to "minor" for single package', () => {
			const entry = createEntry( { 'breaking-change': 'MINOR' } );

			const normalizedEntry = normalizeEntry( entry, true );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( 'minor' );
		} );

		it( 'should normalize "MAJOR" to "major" for single package', () => {
			const entry = createEntry( { 'breaking-change': 'MAJOR' } );

			const normalizedEntry = normalizeEntry( entry, true );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( 'major' );
		} );

		it( 'should handle case insensitivity for single package', () => {
			const entry = createEntry( { 'breaking-change': 'TRUE' } );

			const normalizedEntry = normalizeEntry( entry, true );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( true );
		} );

		it( 'should return undefined for other values for single package', () => {
			const entry = createEntry( { 'breaking-change': 'invalid' } );

			const normalizedEntry = normalizeEntry( entry, true );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBeUndefined();
		} );
	} );

	describe( 'breaking change normalization for monorepo', () => {
		it( 'should normalize "MINOR" to "minor" for monorepo', () => {
			const entry = createEntry( { 'breaking-change': 'MINOR' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( 'minor' );
		} );

		it( 'should normalize "MAJOR" to "major" for monorepo', () => {
			const entry = createEntry( { 'breaking-change': 'MAJOR' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( 'major' );
		} );

		it( 'should handle case insensitivity for monorepo', () => {
			const entry = createEntry( { 'breaking-change': 'MINOR' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( 'minor' );
		} );

		it( 'should return undefined for "true" in monorepo', () => {
			const entry = createEntry( { 'breaking-change': 'true' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBeUndefined();
		} );

		it( 'should return undefined for other values for monorepo', () => {
			const entry = createEntry( { 'breaking-change': 'invalid' } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.breakingChangeNormalized ).toBeUndefined();
		} );
	} );

	describe( 'scope normalization', () => {
		it( 'should normalize scope to lowercase', () => {
			const entry = createEntry( { scope: [ 'EngIne', 'UI' ] } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.scopeNormalized ).toEqual( [ 'engine', 'ui' ] );
		} );

		it( 'should return undefined when scope is not provided', () => {
			const entry = createEntry( {} );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.scopeNormalized ).toBeUndefined();
		} );
	} );

	describe( 'other fields normalization', () => {
		it( 'should maintain closes field', () => {
			const closesValue = [ '123', '456' ];
			const entry = createEntry( { closes: closesValue } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.closesNormalized ).toBe( closesValue );
		} );

		it( 'should maintain see field', () => {
			const seeValue = [ 'https://example.com', 'https://github.com/ckeditor/ckeditor5/issues/123' ];
			const entry = createEntry( { see: seeValue } );

			const normalizedEntry = normalizeEntry( entry, false );

			expect( normalizedEntry.data.seeNormalized ).toBe( seeValue );
		} );
	} );

	describe( 'entry structure preservation', () => {
		it( 'should preserve original data while adding normalized fields', () => {
			const originalEntry = createEntry( {
				type: 'feature',
				'breaking-change': 'minor',
				scope: [ 'ENGINE' ],
				closes: [ '#123' ],
				see: [ 'https://example.com' ]
			} );

			const normalizedEntry = normalizeEntry( originalEntry, false );

			// Check that original data is preserved
			expect( normalizedEntry.content ).toBe( originalEntry.content );
			expect( normalizedEntry.changesetPath ).toBe( originalEntry.changesetPath );
			expect( normalizedEntry.gitHubUrl ).toBe( originalEntry.gitHubUrl );
			expect( normalizedEntry.skipLinks ).toBe( originalEntry.skipLinks );

			// Check that original data fields are preserved
			expect( normalizedEntry.data.type ).toBe( originalEntry.data.type );
			expect( normalizedEntry.data[ 'breaking-change' ] ).toBe( originalEntry.data[ 'breaking-change' ] );
			expect( normalizedEntry.data.scope ).toBe( originalEntry.data.scope );
			expect( normalizedEntry.data.closes ).toBe( originalEntry.data.closes );
			expect( normalizedEntry.data.see ).toBe( originalEntry.data.see );

			// Check that normalized fields are added
			expect( normalizedEntry.data.typeNormalized ).toBe( 'Feature' );
			expect( normalizedEntry.data.breakingChangeNormalized ).toBe( 'minor' );
			expect( normalizedEntry.data.scopeNormalized ).toEqual( [ 'engine' ] );
			expect( normalizedEntry.data.closesNormalized ).toBe( originalEntry.data.closes );
			expect( normalizedEntry.data.seeNormalized ).toBe( originalEntry.data.see );
		} );
	} );
} );
