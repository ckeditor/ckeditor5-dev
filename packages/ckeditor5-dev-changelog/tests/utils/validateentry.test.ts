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
				'Provide a type with one of the values: "Feature", "Other" or "Fix" (case insensitive).'
			);
		} );

		it( 'should return invalid when type is not recognized', () => {
			const entry: ParsedFile = createEntry( { type: 'Unknown' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Type should be one of: "Feature", "Other" or "Fix" (case insensitive).'
			);
		} );

		it( 'should return valid when type is "Feature"', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when type is "Other"', () => {
			const entry: ParsedFile = createEntry( { type: 'Other' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when type is "Fix"', () => {
			const entry: ParsedFile = createEntry( { type: 'Fix' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'breaking change validation for single package', () => {
		it( 'should return invalid when breaking change is not "true" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': false } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Breaking change "false" should be one of: "true", or not specified, for a single repo (case insensitive).'
			);
		} );

		it( 'should return valid when breaking change is "true" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': true } );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "major" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': 'major' } );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "minor" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': 'minor' } );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is any text for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': 'test123' } );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'breaking change validation for monorepo', () => {
		it( 'should return invalid when breaking change is not "minor" or "major" for a monorepo', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': true } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Breaking change "true" should be one of: "minor", "major", for a monorepo (case insensitive).'
			);
		} );

		it( 'should return valid when breaking change is "minor" for a monorepo', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': 'minor' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when breaking change is "major" for a monorepo', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', 'breaking-change': 'major' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );
	} );

	describe( 'scope validation', () => {
		it( 'should add validation message but remain valid when scope is not a valid package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'unknown-package' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Scope "unknown-package" is not recognised as a valid package in the repository.'
			);
			expect( ( validatedEntry.data as any ).scope ).toEqual( [] );
		} );

		it( 'should return valid when scope is a valid package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'ckeditor5-engine' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).scope ).toEqual( [ 'ckeditor5-engine' ] );
		} );

		it( 'should validate multiple scopes but remain valid even if some are invalid', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'ckeditor5-engine', 'unknown-package' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Scope "unknown-package" is not recognised as a valid package in the repository.'
			);
			expect( ( validatedEntry.data as any ).scope ).toEqual( [ 'ckeditor5-engine' ] );
		} );
	} );

	describe( 'see validation', () => {
		it( 'should add validation message but remain valid when see is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'invalid-issue-reference' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'See "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).see ).toEqual( [] );
		} );

		it( 'should return valid when see is an issue number', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ '1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).see ).toEqual( [ '1234' ] );
		} );

		it( 'should return valid when see is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'ckeditor/ckeditor5#1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).see ).toEqual( [ 'ckeditor/ckeditor5#1234' ] );
		} );

		it( 'should return valid when see is a full issue URL', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).see ).toEqual( [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] );
		} );

		it( 'should filter out invalid see references while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'invalid-reference', '1234', 'ckeditor/ckeditor5#5678' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'See "invalid-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).see ).toEqual( [ '1234', 'ckeditor/ckeditor5#5678' ] );
		} );
	} );

	describe( 'closes validation', () => {
		it( 'should add validation message but remain valid when closes is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', closes: [ 'invalid-issue-reference' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Closes "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).closes ).toEqual( [] );
		} );

		it( 'should return valid when closes is an issue number', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', closes: [ '1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).closes ).toEqual( [ '1234' ] );
		} );

		it( 'should return valid when closes is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', closes: [ 'ckeditor/ckeditor5#1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).closes ).toEqual( [ 'ckeditor/ckeditor5#1234' ] );
		} );

		it( 'should return valid when closes is a full issue URL', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				closes: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).closes ).toEqual( [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] );
		} );

		it( 'should filter out invalid closes references while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				closes: [ 'invalid-reference', '1234', 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).validations ).toContain(
				'Closes "invalid-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( ( validatedEntry.data as any ).closes ).toEqual( [ '1234', 'ckeditor/ckeditor5#5678' ] );
		} );
	} );

	describe( 'multiple validations', () => {
		it( 'should collect multiple validation errors but only mark as invalid for critical errors', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Unknown',
				'breaking-change': 'not-valid',
				scope: [ 'unknown-package' ],
				see: [ 'invalid-reference' ],
				closes: [ 'invalid-reference' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( ( validatedEntry.data as any ).validations.length ).toBe( 5 );
			expect( ( validatedEntry.data as any ).scope ).toEqual( [] );
			expect( ( validatedEntry.data as any ).see ).toEqual( [] );
			expect( ( validatedEntry.data as any ).closes ).toEqual( [] );
		} );

		it( 'should return valid for a completely valid entry', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				'breaking-change': 'major',
				scope: [ 'ckeditor5-engine' ],
				see: [ '1234' ],
				closes: [ 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( ( validatedEntry.data as any ).scope ).toEqual( [ 'ckeditor5-engine' ] );
			expect( ( validatedEntry.data as any ).see ).toEqual( [ '1234' ] );
			expect( ( validatedEntry.data as any ).closes ).toEqual( [ 'ckeditor/ckeditor5#5678' ] );
		} );
	} );
} );
