/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../../src/types.js';
import { validateEntry } from '../../src/utils/validateentry.js';
import { describe, it, expect, vi } from 'vitest';

vi.mock( '../../src/constants.js', () => {
	return {
		ISSUE_PATTERN: /^\d+$/,
		ISSUE_SLUG_PATTERN: /^(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)#(?<number>\d+)$/,
		ISSUE_URL_PATTERN: /^(?<base>https:\/\/github\.com)\/(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)\/issues\/(?<number>\d+)$/,
		TYPES: [
			{ name: 'Feature' },
			{ name: 'Fix', aliases: [ 'Fixes', 'Fixed' ] }, // Additional value to test the "is"/"are" grammar options.
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
		skipLinks: false
	};
}

describe( 'validateEntry()', () => {
	const packageNames = [ '@ckeditor/ckeditor5-engine', '@ckeditor/ckeditor5-ui', '@ckeditor/ckeditor5-utils' ];

	describe( 'type validation', () => {
		it( 'should return invalid when type is not provided', () => {
			const entry: ParsedFile = createEntry( {} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toEqual( [
				'Provide a type with one of the values: "Feature", "Fix" ("Fixes", "Fixed" are also allowed),' +
				' "Major breaking change" ("Major" is also allowed), "Minor breaking change" ("Minor" is also allowed),' +
				' or "Breaking change" ("Breaking" is also allowed) (case insensitive).'
			] );
		} );

		it( 'should return invalid when type is not recognized', () => {
			const entry: ParsedFile = createEntry( { type: 'Unknown' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toEqual( [
				'Type "Unknown" should be one of: "Feature", "Fix" ("Fixes", "Fixed" are also allowed),' +
				' "Major breaking change" ("Major" is also allowed), "Minor breaking change" ("Minor" is also allowed),' +
				' or "Breaking change" ("Breaking" is also allowed) (case insensitive).'
			] );
		} );

		it( 'should return valid when type is provided', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when type uses an alias', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Fixes',
				typeNormalized: 'Fix'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'breaking change validation for single package', () => {
		it( 'should return invalid when breaking change is not "Breaking" for a single package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'major',
				typeNormalized: 'Major breaking change'
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toEqual( [
				'Breaking change "major" should be generic: "breaking", for a single package mode (case insensitive).'
			] );
		} );

		it( 'should return valid when breaking change is "Breaking" for a single package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'breaking',
				typeNormalized: 'Breaking change'
			} );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'breaking change validation for monorepo', () => {
		it( 'should return invalid when breaking change is not "minor" or "major" for a monorepo', () => {
			const entry: ParsedFile = createEntry( {
				type: 'breaking',
				typeNormalized: 'Breaking change'
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toEqual( [
				'Breaking change "breaking" should be one of: "minor", "major", for a monorepo (case insensitive).'
			] );
		} );

		it( 'should return valid when breaking change is "minor" for a monorepo', () => {
			const entry: ParsedFile = createEntry( {
				type: 'minor',
				typeNormalized: 'Minor breaking change'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "major" for a monorepo', () => {
			const entry: ParsedFile = createEntry( {
				type: 'major',
				typeNormalized: 'Major breaking change'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'scope validation', () => {
		it( 'should return invalid when scope is not a valid package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'unknown-package' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Scope "unknown-package" is not recognized as a valid package in the repository.'
			);
		} );

		it( 'should return valid when scope is a valid package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'ckeditor5-engine' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should validate multiple scopes correctly', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'ckeditor5-engine', 'unknown-package' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Scope "unknown-package" is not recognized as a valid package in the repository.'
			);
		} );
	} );

	describe( 'see validation', () => {
		it( 'should return invalid when see is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'invalid-issue-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'See "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
		} );

		it( 'should return valid when see is an issue number', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ '1234' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when see is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'ckeditor/ckeditor5#1234' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when see is a full issue URL', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'closes validation', () => {
		it( 'should return invalid when closes is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'invalid-issue-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Closes "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
		} );

		it( 'should return valid when closes is an issue number', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ '1234' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when closes is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'ckeditor/ckeditor5#1234' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when closes is a full issue URL', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'multiple validations', () => {
		it( 'should collect multiple validation errors', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Unknown',
				scopeNormalized: [ 'unknown-package' ],
				seeNormalized: [ 'invalid-reference' ],
				closesNormalized: [ 'invalid-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations.length ).toBe( 4 );
		} );

		it( 'should return valid for a completely valid entry', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'ckeditor5-engine' ],
				seeNormalized: [ '1234' ],
				closesNormalized: [ 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );
} );
