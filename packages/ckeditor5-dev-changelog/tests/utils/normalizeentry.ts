/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { normalizeEntry } from '../../src/utils/normalizeentry.js';
import { type FileMetadata, type ParsedFile } from '../../src/types.js';

function wrapInput(
	partialData: Partial<FileMetadata>
): ParsedFile<Partial<FileMetadata>> {
	return {
		content: '',
		changesetPath: '',
		gitHubUrl: '',
		shouldSkipLinks: false,
		data: partialData
	};
}

describe( 'normalizeEntry', () => {
	describe( 'type normalization', () => {
		it( 'normalizes type to capitalized form', () => {
			const input = wrapInput( { type: 'feature' } );
			const result = normalizeEntry( input, false );
			expect( result.data.type ).toBe( 'Feature' );
		} );

		it( 'normalizes breaking change types to "Breaking change" if isSinglePackage is true', () => {
			const majorInput = wrapInput( { type: 'major breaking change' } );
			const minorInput = wrapInput( { type: 'minor breaking change' } );

			expect( normalizeEntry( majorInput, true ).data.type ).toBe( 'Breaking change' );
			expect( normalizeEntry( minorInput, true ).data.type ).toBe( 'Breaking change' );
		} );

		it( 'does not normalize breaking change types if isSinglePackage is false', () => {
			const input = wrapInput( { type: 'major breaking change' } );
			const result = normalizeEntry( input, false );
			expect( result.data.type ).toBe( 'Major breaking change' );
		} );
	} );

	describe( 'scope normalization', () => {
		it( 'normalizes scope to lowercase and removes falsy values', () => {
			const input = wrapInput( { scope: [ 'API', '', null as any, undefined, 'Utils' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.scope ).toEqual( [ 'api', 'utils' ] );
		} );

		it( 'should replace a string value with an array when normalizing "scope"', () => {
			const input = wrapInput( { scope: 'as-string' as any } );
			const result = normalizeEntry( input, false );
			expect( result.data.scope ).toEqual( [ 'as-string' ] );
		} );

		it( 'deduplicates scope entries', () => {
			const input = wrapInput( { scope: [ 'api', 'api', 'utils', 'utils' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.scope ).toEqual( [ 'api', 'utils' ] );
		} );

		it( 'sorts scope entries alphabetically after normalization', () => {
			const input = wrapInput( {
				scope: [ 'Zebra', 'alpha', 'Beta' ]
			} );

			const result = normalizeEntry( input, false );

			expect( result.data.scope ).toEqual( [ 'alpha', 'beta', 'zebra' ] );
		} );
	} );

	describe( 'see normalization', () => {
		it( 'normalizes and removes falsy see entries', () => {
			const input = wrapInput( { see: [ 'ref1', '', null as any, undefined, 'ref2' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.see ).toEqual( [ 'ref1', 'ref2' ] );
		} );

		it( 'should replace a string value with an array when normalizing "see"', () => {
			const input = wrapInput( { see: 'as-string' as any } );
			const result = normalizeEntry( input, false );
			expect( result.data.see ).toEqual( [ 'as-string' ] );
		} );

		it( 'deduplicates see entries', () => {
			const input = wrapInput( { see: [ 'ref1', 'ref1', 'ref2' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.see ).toEqual( [ 'ref1', 'ref2' ] );
		} );
	} );

	describe( 'closes normalization', () => {
		it( 'normalizes and removes falsy closes entries', () => {
			const input = wrapInput( { closes: [ '#123', '', null as any, undefined, '#456' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.closes ).toEqual( [ '#123', '#456' ] );
		} );

		it( 'should replace a string value with an array when normalizing "closes"', () => {
			const input = wrapInput( { closes: 'as-string' as any } );
			const result = normalizeEntry( input, false );
			expect( result.data.closes ).toEqual( [ 'as-string' ] );
		} );

		it( 'deduplicates closes entries', () => {
			const input = wrapInput( { closes: [ '#123', '#123', '#456' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.closes ).toEqual( [ '#123', '#456' ] );
		} );
	} );

	describe( 'communityCredits normalization', () => {
		it( 'adds @ prefix if missing and removes falsy values', () => {
			const input = wrapInput( { communityCredits: [ 'user1', '@user2', '', null as any, undefined ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.communityCredits ).toEqual( [ '@user1', '@user2' ] );
		} );

		it( 'should replace a string value with an array when normalizing "communityCredits"', () => {
			const input = wrapInput( { communityCredits: 'as-string' as any } );
			const result = normalizeEntry( input, false );
			expect( result.data.communityCredits ).toEqual( [ '@as-string' ] );
		} );

		it( 'deduplicates communityCredits entries', () => {
			const input = wrapInput( { communityCredits: [ '@user1', '@user1', '@user2' ] } );
			const result = normalizeEntry( input, false );
			expect( result.data.communityCredits ).toEqual( [ '@user1', '@user2' ] );
		} );
	} );

	describe( 'general structure', () => {
		it( 'sets validations to an empty array', () => {
			const input = wrapInput( { type: 'feature' } );
			const result = normalizeEntry( input, false );
			expect( result.data.validations ).toEqual( [] );
		} );

		it( 'handles completely missing fields gracefully', () => {
			const input = wrapInput( {} );
			const result = normalizeEntry( input, false );
			expect( result.data.type ).toBe( 'Undefined' );
			expect( result.data.scope ).toEqual( [] );
			expect( result.data.closes ).toEqual( [] );
			expect( result.data.see ).toEqual( [] );
			expect( result.data.communityCredits ).toEqual( [] );
		} );
	} );
} );
