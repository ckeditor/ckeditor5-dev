/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { getSectionsToDisplay } from '../../src/utils/getsectionstodisplay.js';
import type { SectionsWithEntries, Section, Entry } from '../../src/types.js';

const createSection = ( title: string, entries: Array<Entry> ): Section => ( {
	title,
	entries
} );

const createEntry = ( message: string ): Entry => ( { message } ) as any;

describe( 'getSectionsToDisplay', () => {
	it( 'should return only valid sections with entries', () => {
		const sectionsWithEntries: SectionsWithEntries = {
			major: createSection( 'Major Changes', [ createEntry( 'Breaking change' ) ] ),
			minor: createSection( 'Minor Changes', [ createEntry( 'Minor change' ) ] ),
			feature: createSection( 'Features', [] ),
			fix: createSection( 'Fix', [] ),
			other: createSection( 'Other', [] ),
			invalid: createSection( 'Invalid', [ createEntry( 'Invalid entry' ) ] )
		};

		const result = getSectionsToDisplay( sectionsWithEntries );

		expect( result ).toEqual( [
			{ title: 'Major Changes', entries: [ { message: 'Breaking change' } ] },
			{ title: 'Minor Changes', entries: [ { message: 'Minor change' } ] }
		] );
	} );

	it( 'should throw an error if all sections are invalid or empty', () => {
		const sectionsWithEntries: SectionsWithEntries = {
			major: createSection( 'Major Changes', [] ),
			minor: createSection( 'Minor Changes', [] ),
			feature: createSection( 'Features', [] ),
			fix: createSection( 'Fix', [] ),
			other: createSection( 'Other', [] ),
			invalid: createSection( 'Invalid', [ createEntry( 'Invalid entry' ) ] )
		};

		expect( () => {
			getSectionsToDisplay( sectionsWithEntries );
		} ).toThrow( 'No valid changesets found. Aborting.' );
	} );
} );
