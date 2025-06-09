/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { sortEntriesByScopeAndDate } from '../../src/utils/sortentriesbyscopeanddate.js';
import type { ParsedFile } from '../../src/types.js';

function createMockEntry(
	scope: Array<string>,
	dateCreated: Date,
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
		changesetPath: '',
		dateCreated,
		gitHubUrl,
		shouldSkipLinks
	};
}

describe( 'sortEntriesByScopeAndDate()', () => {
	it( 'should sort entries with single scope alphabetically by scope name, then by date (older first)', () => {
		const entries = [
			createMockEntry( [ 'ui' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'ui' ], new Date( 2025, 3, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'engine' ], new Date( 2025, 4, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]?.data.scope ).toEqual( [ 'core' ] );
		expect( sorted[ 0 ]?.dateCreated ).toEqual( new Date( 2025, 2, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 1 ]?.data.scope ).toEqual( [ 'engine' ] );
		expect( sorted[ 1 ]?.dateCreated ).toEqual( new Date( 2025, 4, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 2 ]?.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 2 ]?.dateCreated ).toEqual( new Date( 2025, 1, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 3 ]?.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 3 ]?.dateCreated ).toEqual( new Date( 2025, 3, 1, 0, 0, 0, 0 ) );
	} );

	it( 'should sort entries with same single scope by date (older first)', () => {
		const entries = [
			createMockEntry( [ 'core' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core' ], new Date( 2025, 3, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted ).toHaveLength( 3 );
		expect( sorted[ 0 ]!.dateCreated ).toEqual( new Date( 2025, 1, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 1 ]!.dateCreated ).toEqual( new Date( 2025, 2, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 2 ]!.dateCreated ).toEqual( new Date( 2025, 3, 1, 0, 0, 0, 0 ) );
	} );

	it( 'should sort entries with same number of scopes by date (older first)', () => {
		const entries = [
			createMockEntry( [ 'ui', 'engine' ], new Date( 2025, 3, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core', 'utils' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'widget', 'typing' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.dateCreated ).toEqual( new Date( 2025, 1, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 1 ]!.dateCreated ).toEqual( new Date( 2025, 2, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 2 ]!.dateCreated ).toEqual( new Date( 2025, 3, 1, 0, 0, 0, 0 ) );
	} );

	it( 'should sort by number of scopes (more scopes first)', () => {
		const entries = [
			createMockEntry( [ 'core' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'ui', 'engine', 'widget' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'utils', 'typing' ], new Date( 2025, 3, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [], new Date( 2025, 4, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.data.scope ).toEqual( [ 'ui', 'engine', 'widget' ] );
		expect( sorted[ 1 ]!.data.scope ).toEqual( [ 'utils', 'typing' ] );
		expect( sorted[ 2 ]!.data.scope ).toEqual( [ 'core' ] );
		expect( sorted[ 3 ]!.data.scope ).toEqual( [] );
	} );

	it( 'should handle entries without scope', () => {
		const entries = [
			createMockEntry( [], new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [], new Date( 2025, 2, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [], new Date( 2025, 3, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted[ 0 ]!.dateCreated ).toEqual( new Date( 2025, 1, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 1 ]!.dateCreated ).toEqual( new Date( 2025, 2, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 2 ]!.dateCreated ).toEqual( new Date( 2025, 3, 1, 0, 0, 0, 0 ) );
	} );

	it( 'should handle entries with undefined scope as empty array', () => {
		const entriesWithUndefinedScope = [
			createMockEntry( undefined as any, new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'ui' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entriesWithUndefinedScope );

		// Entry with undefined scope should be treated as having 0 scopes and come after entry with scope
		expect( sorted[ 0 ]!.data.scope ).toEqual( [ 'ui' ] );
		expect( sorted[ 1 ]!.data.scope ).toBeUndefined();
	} );

	it( 'should handle mixed scenarios with different scope counts and dates', () => {
		const entries = [
			createMockEntry( [ 'ui' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core', 'utils', 'engine' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core' ], new Date( 2025, 3, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'widget', 'typing' ], new Date( 2025, 4, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [], new Date( 2025, 5, 1, 0, 0, 0, 0 ) )
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
			createMockEntry( [ 'ui' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( [ 'core' ], new Date( 2025, 2, 1, 0, 0, 0, 0 ) )
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
			createMockEntry( [ 'core' ], new Date( 2025, 1, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entries );

		expect( sorted ).toHaveLength( 1 );
		expect( sorted[ 0 ]! ).toEqual( entries[ 0 ] );
	} );

	it( 'should handle entries when all scopes are undefined', () => {
		const entriesWithUndefinedScopes = [
			createMockEntry( undefined as any, new Date( 2025, 1, 1, 0, 0, 0, 0 ) ),
			createMockEntry( undefined as any, new Date( 2025, 2, 1, 0, 0, 0, 0 ) )
		];

		const sorted = sortEntriesByScopeAndDate( entriesWithUndefinedScopes );

		// When both scopes are undefined, should fall back to date sorting (older first)
		expect( sorted[ 0 ]!.dateCreated ).toEqual( new Date( 2025, 1, 1, 0, 0, 0, 0 ) );
		expect( sorted[ 1 ]!.dateCreated ).toEqual( new Date( 2025, 2, 1, 0, 0, 0, 0 ) );
	} );
} );
