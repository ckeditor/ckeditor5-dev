/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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

	it( 'should throw an InternalError if all sections are invalid or empty', () => {
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

	it( 'should throw an error with a correct message if all sections are invalid or empty', () => {
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
		} ).toThrow(
			'No valid entries were found. Please ensure that:\n' +
			'1) Input files exist in the `.changelog/` directory.\n' +
			'2) The `cwd` parameter points to the root of your project.\n' +
			'3) The `packagesDirectory` parameter correctly specifies the packages folder.\n' +
			'If no errors appear in the console but inputs are present, your project configuration may be incorrect.\n' +
			'If validation errors are shown, please resolve them according to the details provided.\n'
		);
	} );
} );
