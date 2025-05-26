/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../../src/types.js';
import { validateEntry } from '../../src/utils/validateentry.js';
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

describe( 'validateEntry()', () => {
	const packageNames = [ '@ckeditor/ckeditor5-engine', '@ckeditor/ckeditor5-ui', '@ckeditor/ckeditor5-utils' ];

	describe( 'type validation', () => {
		it( 'should return invalid when type is not provided', () => {
			const entry: ParsedFile = createEntry( {} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Provide a type with one of the values: "Feature", "Other" or "Fix" ("Fixes" is allowed) (case insensitive).'
			);
		} );

		it( 'should return invalid when type is not recognized', () => {
			const entry: ParsedFile = createEntry( { type: 'Unknown', typeNormalized: 'Unknown' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Type "Unknown" should be one of: "Feature", "Other" or "Fix" ("Fixes" is allowed) (case insensitive).'
			);
		} );

		it( 'should return valid when type is "Feature"', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when type is "Other"', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Other',
				typeNormalized: 'Other'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when type is "Fix"', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Fix',
				typeNormalized: 'Fix'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'breaking change validation for single package', () => {
		it( 'should return invalid when breaking change is not "true" for a single package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': false,
				breakingChangeNormalized: false
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Breaking change "false" should be one of: "true", or not specified, for a single repo (case insensitive).'
			);
		} );

		it( 'should return valid when breaking change is "true" for a single package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': true,
				breakingChangeNormalized: true
			} );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "major" for a single package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': 'major',
				breakingChangeNormalized: 'major'
			} );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "minor" for a single package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': 'minor',
				breakingChangeNormalized: 'minor'
			} );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'breaking change validation for monorepo', () => {
		it( 'should return invalid when breaking change is not "minor" or "major" for a monorepo', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': true,
				breakingChangeNormalized: true
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Breaking change "true" should be one of: "minor", "major", for a monorepo (case insensitive).'
			);
		} );

		it( 'should return valid when breaking change is "minor" for a monorepo', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': 'minor',
				breakingChangeNormalized: 'minor'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "major" for a monorepo', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': 'major',
				breakingChangeNormalized: 'major'
			} );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'scope validation', () => {
		it( 'should add validation message but remain valid when scope is not a valid package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'unknown-package' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Scope "unknown-package" is not recognised as a valid package in the repository.'
			);
			expect( ( validatedEntry.data as any ).scopeValidated ).toEqual( [] );
		} );

		it( 'should return valid when scope is a valid package', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'ckeditor5-engine' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).scopeValidated ).toEqual( [ 'ckeditor5-engine' ] );
		} );

		it( 'should validate multiple scopes but remain valid even if some are invalid', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				scopeNormalized: [ 'ckeditor5-engine', 'unknown-package' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Scope "unknown-package" is not recognised as a valid package in the repository.'
			);
			expect( ( validatedEntry.data as any ).scopeValidated ).toEqual( [ 'ckeditor5-engine' ] );
		} );
	} );

	describe( 'see validation', () => {
		it( 'should add validation message but remain valid when see is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'invalid-issue-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'See "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [] );
		} );

		it( 'should return valid when see is an issue number', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ '1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [ '1234' ] );
		} );

		it( 'should return valid when see is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'ckeditor/ckeditor5#1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [ 'ckeditor/ckeditor5#1234' ] );
		} );

		it( 'should return valid when see is a full issue URL', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] );
		} );

		it( 'should filter out invalid see references while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				seeNormalized: [ 'invalid-reference', '1234', 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'See "invalid-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [ '1234', 'ckeditor/ckeditor5#5678' ] );
		} );
	} );

	describe( 'closes validation', () => {
		it( 'should add validation message but remain valid when closes is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'invalid-issue-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Closes "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [] );
		} );

		it( 'should return valid when closes is an issue number', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ '1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [ '1234' ] );
		} );

		it( 'should return valid when closes is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'ckeditor/ckeditor5#1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [ 'ckeditor/ckeditor5#1234' ] );
		} );

		it( 'should return valid when closes is a full issue URL', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] );
		} );

		it( 'should filter out invalid closes references while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				closesNormalized: [ 'invalid-reference', '1234', 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Closes "invalid-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [ '1234', 'ckeditor/ckeditor5#5678' ] );
		} );
	} );

	describe( 'multiple validations', () => {
		it( 'should collect multiple validation errors but only mark as invalid for critical errors', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Unknown',
				'breaking-change': 'not-valid',
				breakingChangeNormalized: 'not-valid',
				scopeNormalized: [ 'unknown-package' ],
				seeNormalized: [ 'invalid-reference' ],
				closesNormalized: [ 'invalid-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations.length ).toBe( 5 );
			expect( ( validatedEntry.data as any ).scopeValidated ).toEqual( [] );
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [] );
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [] );
		} );

		it( 'should return valid for a completely valid entry', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				typeNormalized: 'Feature',
				'breaking-change': 'major',
				breakingChangeNormalized: 'major',
				scopeNormalized: [ 'ckeditor5-engine' ],
				seeNormalized: [ '1234' ],
				closesNormalized: [ 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).scopeValidated ).toEqual( [ 'ckeditor5-engine' ] );
			expect( ( validatedEntry.data as any ).seeValidated ).toEqual( [ '1234' ] );
			expect( ( validatedEntry.data as any ).closesValidated ).toEqual( [ 'ckeditor/ckeditor5#5678' ] );
		} );
	} );
} );
