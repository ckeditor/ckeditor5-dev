/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractTimestampFromPath, sortEntries, sortSectionEntries } from '../../src/utils/sortentries.js';
import type { Entry, SectionsWithEntries } from '../../src/types.js';

describe( 'sortEntries()', () => {
	let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach( () => {
		consoleWarnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		consoleWarnSpy.mockRestore();
	} );

	describe( 'extractTimestampFromPath', () => {
		it( 'should extract timestamp from valid changeset file path', () => {
			const path = '.changelog/20250119153400_epic_ck_18051_changeset.md';
			const timestamp = extractTimestampFromPath( path );
			const expectedDate = new Date( 2025, 0, 19, 15, 34, 0 ); // Month is 0-indexed

			expect( timestamp ).toBe( expectedDate.getTime() );
		} );

		it( 'should handle invalid timestamp format and log warning', () => {
			const path = '.changelog/invalid_changeset.md';
			const timestamp = extractTimestampFromPath( path );

			expect( consoleWarnSpy ).toHaveBeenCalledWith(
				'Warning: Changeset file ".changelog/invalid_changeset.md" does not ' +
				'follow the expected format YYYYMMDDHHMMSS_branch.md. Using current timestamp for sorting.'
			);
			expect( timestamp ).toBeGreaterThan( 0 );
		} );

		it( 'should handle invalid timestamp format and log warning', () => {
			// Use a timestamp that doesn't match the regex pattern
			const path = '.changelog/abcd1399999999_invalid_date.md';
			const timestamp = extractTimestampFromPath( path );

			expect( consoleWarnSpy ).toHaveBeenCalledWith(
				'Warning: Changeset file ".changelog/abcd1399999999_invalid_date.md" does not follow ' +
				'the expected format YYYYMMDDHHMMSS_branch.md. Using current timestamp for sorting.'
			);
			expect( timestamp ).toBeGreaterThan( 0 );
		} );

		it( 'should handle edge case with valid format but extreme values', () => {
			// This will pass the regex but create a valid date due to JS Date constructor behavior
			const path = '.changelog/20251399999999_extreme_values.md';
			const timestamp = extractTimestampFromPath( path );

			// This should not trigger a warning because JS Date constructor handles it
			expect( consoleWarnSpy ).not.toHaveBeenCalled();
			expect( timestamp ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'sortEntries', () => {
		it( 'should sort entries by creation time (oldest first)', () => {
			const entries: Array<Entry> = [
				createMockEntry( '.changelog/20250119153400_newer.md', [ 'package-a' ] ),
				createMockEntry( '.changelog/20250119153300_older.md', [ 'package-b' ] )
			];

			const sorted = sortEntries( entries );

			expect( sorted[ 0 ]?.changesetPath ).toBe( '.changelog/20250119153300_older.md' );
			expect( sorted[ 1 ]?.changesetPath ).toBe( '.changelog/20250119153400_newer.md' );
		} );

		it( 'should place entries with many scopes at the top', () => {
			const entries: Array<Entry> = [
				createMockEntry( '.changelog/20250119153400_single.md', [ 'package-a' ] ),
				createMockEntry( '.changelog/20250119153400_multiple.md', [ 'package-a', 'package-b', 'package-c' ] )
			];

			const sorted = sortEntries( entries );

			expect( sorted[ 0 ]?.data.scope ).toHaveLength( 3 );
			expect( sorted[ 1 ]?.data.scope ).toHaveLength( 1 );
		} );

		it( 'should place entries without packages at the bottom', () => {
			const entries: Array<Entry> = [
				createMockEntry( '.changelog/20250119153400_no_scope.md', [] ),
				createMockEntry( '.changelog/20250119153400_with_scope.md', [ 'package-a' ] )
			];

			const sorted = sortEntries( entries );

			expect( sorted[ 0 ]?.data.scope ).toHaveLength( 1 );
			expect( sorted[ 1 ]?.data.scope ).toHaveLength( 0 );
		} );

		it( 'should sort packages alphabetically when same number of scopes', () => {
			const entries: Array<Entry> = [
				createMockEntry( '.changelog/20250119153400_z.md', [ 'z-package' ] ),
				createMockEntry( '.changelog/20250119153400_a.md', [ 'a-package' ] )
			];

			const sorted = sortEntries( entries );

			expect( sorted[ 0 ]?.data.scope![ 0 ] ).toBe( 'a-package' );
			expect( sorted[ 1 ]?.data.scope![ 0 ] ).toBe( 'z-package' );
		} );

		it( 'should handle complex sorting scenario', () => {
			const entries: Array<Entry> = [
				createMockEntry( '.changelog/20250119153400_no_scope.md', [] ),
				createMockEntry( '.changelog/20250119153300_old_multi.md', [ 'b-package', 'c-package' ] ),
				createMockEntry( '.changelog/20250119153400_single_z.md', [ 'z-package' ] ),
				createMockEntry( '.changelog/20250119153400_single_a.md', [ 'a-package' ] )
			];

			const sorted = sortEntries( entries );

			expect( sorted[ 0 ]?.changesetPath ).toBe( '.changelog/20250119153300_old_multi.md' );
			expect( sorted[ 1 ]?.changesetPath ).toBe( '.changelog/20250119153400_single_a.md' );
			expect( sorted[ 2 ]?.changesetPath ).toBe( '.changelog/20250119153400_single_z.md' );
			expect( sorted[ 3 ]?.changesetPath ).toBe( '.changelog/20250119153400_no_scope.md' );
		} );
	} );

	describe( 'sortSectionEntries', () => {
		it( 'should sort entries in all sections', () => {
			const sections: SectionsWithEntries = {
				major: {
					title: 'Major',
					entries: [
						createMockEntry( '.changelog/20250119153400_newer.md', [ 'package-a' ] ),
						createMockEntry( '.changelog/20250119153300_older.md', [ 'package-b' ] )
					]
				},
				minor: { title: 'Minor', entries: [] },
				breaking: { title: 'Breaking', entries: [] },
				feature: {
					title: 'Features',
					entries: [
						createMockEntry( '.changelog/20250119153400_no_scope.md', [] ),
						createMockEntry( '.changelog/20250119153400_with_scope.md', [ 'package-a' ] )
					]
				},
				fix: { title: 'Fixes', entries: [] },
				other: { title: 'Other', entries: [] },
				warning: { title: 'Warning', entries: [], excludeInChangelog: true },
				invalid: { title: 'Invalid', entries: [], excludeInChangelog: true }
			};

			const sorted = sortSectionEntries( sections );

			// Check major section sorting (by timestamp)
			expect( sorted.major.entries[ 0 ]?.changesetPath ).toBe( '.changelog/20250119153300_older.md' );
			expect( sorted.major.entries[ 1 ]?.changesetPath ).toBe( '.changelog/20250119153400_newer.md' );

			// Check feature section sorting (scoped entries first)
			expect( sorted.feature.entries[ 0 ]?.data.scope ).toHaveLength( 1 );
			expect( sorted.feature.entries[ 1 ]?.data.scope ).toHaveLength( 0 );
		} );
	} );
} );

function createMockEntry( changesetPath: string, scope: Array<string> ): Entry {
	return {
		message: 'Mock message',
		data: {
			scope,
			mainContent: 'Mock content',
			restContent: []
		},
		changesetPath
	};
}
