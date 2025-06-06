/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { filterVisibleSections } from '../../src/utils/filtervisiblesections.js';
import { InternalError } from '../../src/utils/internalerror.js';
import type { SectionsWithEntries, Section, Entry } from '../../src/types.js';

const createSection = ( title: string, entries: Array<Entry>, excludeInChangelog: boolean = false ): Section => ( {
	title,
	entries,
	excludeInChangelog
} );

const createEntry = ( message: string ): Entry => ( { message } ) as any;

describe( 'filterVisibleSections()', () => {
	it( 'should return only valid sections with entries', () => {
		const sectionsWithEntries: SectionsWithEntries = {
			major: createSection( 'Major Changes', [ createEntry( 'Breaking change' ) ] ),
			minor: createSection( 'Minor Changes', [ createEntry( 'Minor change' ) ] ),
			feature: createSection( 'Features', [] ),
			fix: createSection( 'Fix', [] ),
			other: createSection( 'Other', [] ),
			invalid: createSection( 'Invalid', [ createEntry( 'Invalid entry' ) ], true ),
			warning: createSection( 'Warning', [ createEntry( 'Invalid entry' ) ], true ),
			breaking: createSection( 'Breaking Changes', [] )
		};

		const result = filterVisibleSections( sectionsWithEntries );

		expect( result ).toEqual( expect.arrayContaining( [
			expect.objectContaining( { title: 'Major Changes', entries: [ { message: 'Breaking change' } ] } )
		] ) );

		expect( result ).toEqual( expect.arrayContaining( [
			expect.objectContaining( { title: 'Minor Changes', entries: [ { message: 'Minor change' } ] } )
		] ) );
	} );

	it( 'should throw an error if all sections are invalid or empty', () => {
		const sectionsWithEntries: SectionsWithEntries = {
			major: createSection( 'Major Changes', [] ),
			minor: createSection( 'Minor Changes', [] ),
			feature: createSection( 'Features', [] ),
			fix: createSection( 'Fix', [] ),
			other: createSection( 'Other', [] ),
			invalid: createSection( 'Invalid', [ createEntry( 'Invalid entry' ) ], true ),
			warning: createSection( 'Warning', [ createEntry( 'Invalid entry' ) ], true ),
			breaking: createSection( 'Breaking Changes', [] )
		};

		expect( () => {
			filterVisibleSections( sectionsWithEntries );
		} ).toThrow( InternalError );
	} );
} );
