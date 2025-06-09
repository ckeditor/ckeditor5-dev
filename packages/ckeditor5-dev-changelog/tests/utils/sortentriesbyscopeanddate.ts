/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { sortEntriesByScopeAndDate } from '../../src/utils/sortentriesbyscopeanddate.js';
import type { ParsedFile } from '../../src/types.js';

function createMockEntry(
	scope: Array<string>,
	changesetPath: string,
	content: string = 'Test content',
	gitHubUrl: string = 'https://github.com/test/repo',
	shouldSkipLinks: boolean = false
): ParsedFile {
	return {
		content,
		data: {
			type: 'feat',
			scope,
			closes: [],
			see: [],
			communityCredits: [],
			validations: []
		},
		changesetPath,
		gitHubUrl,
		shouldSkipLinks
	};
}

describe( 'sortEntriesByScopeAndDate()', () => {
	it( 'should sort entries with single scope alphabetically by scope name, then by date (older first)', () => {
		const entries = [
			createMockEntry( [ 'ui' ], 'path/20240102120000_feature.md' ),
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'ui' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'engine' ], 'path/20240103120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]?.data.scope ).toEqual( [ 'core' ] );
		expect( sorted[ 0 ]?.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]?.data.scope ).toEqual( [ 'engine' ] );
		expect( sorted[ 1 ]?.changesetPath ).toBe( 'path/20240103120000_feature.md' );
		expect( sorted[ 2 ]?.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 2 ]?.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 3 ]?.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 3 ]?.changesetPath ).toBe( 'path/20240102120000_feature.md' );
	} );

	it( 'should sort entries with same single scope by date (older first)', () => {
		const entries = [
			createMockEntry( [ 'core' ], 'path/20240103120000_feature.md' ),
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'core' ], 'path/20240102120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted ).toHaveLength( 3 );
		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( 'path/20240102120000_feature.md' );
		expect( sorted[ 2 ]!.changesetPath ).toBe( 'path/20240103120000_feature.md' );
	} );

	it( 'should sort entries with same number of scopes by date (older first)', () => {
		const entries = [
			createMockEntry( [ 'ui', 'engine' ], 'path/20240103120000_feature.md' ),
			createMockEntry( [ 'core', 'utils' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'widget', 'typing' ], 'path/20240102120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( 'path/20240102120000_feature.md' );
		expect( sorted[ 2 ]!.changesetPath ).toBe( 'path/20240103120000_feature.md' );
	} );

	it( 'should sort by number of scopes (more scopes first)', () => {
		const entries = [
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'ui', 'engine', 'widget' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'utils', 'typing' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [], 'path/20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.data.scope ).toEqual( [ 'ui', 'engine', 'widget' ] );
		expect( sorted[ 1 ]!.data.scope ).toEqual( [ 'utils', 'typing' ] );
		expect( sorted[ 2 ]!.data.scope ).toEqual( [ 'core' ] );
		expect( sorted[ 3 ]!.data.scope ).toEqual( [] );
	} );

	it( 'should handle entries without scope', () => {
		const entries = [
			createMockEntry( [], 'path/20240103120000_feature.md' ),
			createMockEntry( [], 'path/20240101120000_feature.md' ),
			createMockEntry( [], 'path/20240102120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( 'path/20240102120000_feature.md' );
		expect( sorted[ 2 ]!.changesetPath ).toBe( 'path/20240103120000_feature.md' );
	} );

	it( 'should handle entries with undefined scope as empty array', () => {
		const entriesWithUndefinedScope = [
			{
				...createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' ),
				data: {
					...createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' ).data,
					scope: undefined as any
				}
			},
			createMockEntry( [ 'ui' ], 'path/20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entriesWithUndefinedScope );

		// Entry with undefined scope should be treated as having 0 scopes and come after entry with scope
		expect( sorted[ 0 ]!.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 1 ]!.data.scope ).toBeUndefined();
	} );

	it( 'should handle filenames without date pattern (fallback to current date)', () => {
		const entries = [
			createMockEntry( [ 'core' ], 'path/invalid-filename.md' ),
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		// Entry with valid date should come first (older date)
		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( 'path/invalid-filename.md' );
	} );

	it( 'should handle filenames with invalid date format (fallback to current date)', () => {
		const entries = [
			createMockEntry( [ 'core' ], 'path/99999999999999_feature.md' ), // Invalid date
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		// Entry with valid date should come first (older date)
		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( 'path/99999999999999_feature.md' );
	} );

	it( 'should handle filenames without extension or path separators', () => {
		const entries = [
			createMockEntry( [ 'core' ], '20240102120000_feature.md' ),
			createMockEntry( [ 'core' ], '20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.changesetPath ).toBe( '20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( '20240102120000_feature.md' );
	} );

	it( 'should handle empty filename (fallback to current date)', () => {
		const entries = [
			createMockEntry( [ 'core' ], '' ),
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		// Entry with valid date should come first (older date)
		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( '' );
	} );

	it( 'should handle mixed scenarios with different scope counts and dates', () => {
		const entries = [
			createMockEntry( [ 'ui' ], 'path/20240103120000_feature.md' ),
			createMockEntry( [ 'core', 'utils', 'engine' ], 'path/20240102120000_feature.md' ),
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' ),
			createMockEntry( [ 'widget', 'typing' ], 'path/20240104120000_feature.md' ),
			createMockEntry( [], 'path/20240105120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		// Order should be:
		// 1. 3 scopes first
		// 2. 2 scopes next
		// 3. 1 scope entries by scope name (core, ui)
		// 4. 0 scopes last
		expect( sorted[ 0 ]!.data.scope ).toEqual( [ 'core', 'utils', 'engine' ] );
		expect( sorted[ 1 ]!.data.scope ).toEqual( [ 'widget', 'typing' ] );
		expect( sorted[ 2 ]!.data.scope ).toEqual( [ 'core' ] );
		expect( sorted[ 3 ]!.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 4 ]!.data.scope ).toEqual( [] );
	} );

	it( 'should modify the original array (sort mutates)', () => {
		const entries = [
			createMockEntry( [ 'ui' ], 'path/20240102120000_feature.md' ),
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' )
		];
		const originalEntries = [ ...entries ];

		const sorted = sortEntriesByScopeAndDate( entries );

		// Original array should be modified (Array.sort mutates)
		expect( entries ).not.toEqual( originalEntries );
		// Sorted array should be the same reference as original
		expect( sorted ).toBe( entries );
		expect( sorted[ 0 ]!.data.scope ).toEqual( [ 'core' ] );
		expect( sorted[ 1 ]!.data.scope ).toEqual( [ 'ui' ] );
	} );

	it( 'should handle empty array', () => {
		const entries: Array<ParsedFile> = [];
		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted ).toEqual( [] );
	} );

	it( 'should handle single entry', () => {
		const entries = [
			createMockEntry( [ 'core' ], 'path/20240101120000_feature.md' )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted ).toHaveLength( 1 );
		expect( sorted[ 0 ]! ).toEqual( entries[ 0 ] );
	} );

	it( 'should handle entries when all scopes are undefined', () => {
		const entriesWithUndefinedScopes = [
			{
				...createMockEntry( [ 'test' ], 'path/20240102120000_feature.md' ),
				data: {
					...createMockEntry( [ 'test' ], 'path/20240102120000_feature.md' ).data,
					scope: undefined as any
				}
			},
			{
				...createMockEntry( [ 'test' ], 'path/20240101120000_feature.md' ),
				data: {
					...createMockEntry( [ 'test' ], 'path/20240101120000_feature.md' ).data,
					scope: undefined as any
				}
			}
		];

		const sorted = sortEntriesByScopeAndDate( entriesWithUndefinedScopes );

		// When both scopes are undefined, should fall back to date sorting (older first)
		expect( sorted[ 0 ]!.changesetPath ).toBe( 'path/20240101120000_feature.md' );
		expect( sorted[ 1 ]!.changesetPath ).toBe( 'path/20240102120000_feature.md' );
	} );
} );
