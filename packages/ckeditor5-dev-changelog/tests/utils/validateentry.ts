/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../../src/types.js';
import { validateEntry } from '../../src/utils/validateentry.js';
import { describe, it, expect, vi } from 'vitest';

vi.mock( '../../src/utils/constants.js', () => {
	return {
		ISSUE_PATTERN: /^\d+$/,
		ISSUE_SLUG_PATTERN: /^(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)#(?<number>\d+)$/,
		ISSUE_URL_PATTERN: /^(?<base>https:\/\/github\.com)\/(?<owner>[a-z0-9.-]+)\/(?<repository>[a-z0-9.-]+)\/issues\/(?<number>\d+)$/,
		NICK_NAME_PATTERN: /^@[a-z0-9-_]+$/i,
		TYPES: [
			{ name: 'Feature' },
			{ name: 'Other' },
			{ name: 'Fix' },
			{ name: 'Major breaking change' },
			{ name: 'Minor breaking change' },
			{ name: 'Breaking change' }
		]
	};
} );

function createEntry( data: Record<string, any> ): ParsedFile {
	return {
		content: 'Test content',
		createdAt: new Date(),
		data: {
			see: [],
			closes: [],
			scope: [],
			validations: [],
			communityCredits: [],
			...data
		} as any,
		changesetPath: 'path/to/changeset',
		gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
		linkFilter: () => true
	};
}

describe( 'validateEntry()', () => {
	const packageNames = [ '@ckeditor/ckeditor5-engine', '@ckeditor/ckeditor5-ui', '@ckeditor/ckeditor5-utils' ];

	describe( 'type validation', () => {
		it( 'should return invalid when type is not provided', () => {
			const entry: ParsedFile = createEntry( {} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( validatedEntry.data.validations ).toContain(
				'Provide a type with one of the values: "Feature", "Other", "Fix", ' +
				'"Major breaking change", "Minor breaking change", or "Breaking change" (case insensitive).'
			);
		} );

		it( 'should return invalid when type is not recognized', () => {
			const entry: ParsedFile = createEntry( { type: 'Unknown' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( validatedEntry.data.validations ).toEqual( [
				'Type is required and should be one of: "Feature", "Other", "Fix", ' +
				'"Major breaking change", "Minor breaking change", or "Breaking change" (case insensitive).'
			] );
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

		it( 'should return valid when type is "Breaking change" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Breaking change' } );

			const { isValid } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return invalid when type is "Major breaking change" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Major breaking change' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeFalsy();
			expect( validatedEntry.data.validations ).toEqual( [
				'Breaking change "Major breaking change" should be generic: ' +
				'"Breaking change", for a single package mode (case insensitive).'
			] );
		} );

		it( 'should return invalid when type is "Minor breaking change" for a single package', () => {
			const entry: ParsedFile = createEntry( { type: 'Minor breaking change' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeFalsy();
			expect( validatedEntry.data.validations ).toEqual( [
				'Breaking change "Minor breaking change" should be generic: ' +
				'"Breaking change", for a single package mode (case insensitive).'
			] );
		} );

		it( 'should return valid when type is "Major breaking change" for a monorepo', () => {
			const entry: ParsedFile = createEntry( { type: 'Major breaking change' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return valid when type is "Minor breaking change" for a monorepo', () => {
			const entry: ParsedFile = createEntry( { type: 'Minor breaking change' } );

			const { isValid } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
		} );

		it( 'should return invalid when type is "Breaking change" for a monorepo', () => {
			const entry: ParsedFile = createEntry( { type: 'Breaking change' } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( validatedEntry.data.validations ).toEqual( [
				'Breaking change "Breaking change" should be one of: ' +
				'"Minor breaking change", "Major breaking change" for a monorepo (case insensitive).'
			] );
		} );
	} );

	describe( 'scope validation', () => {
		it( 'should add validation message but remain valid when scope is not a valid package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'unknown-package' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'Scope "unknown-package" is not recognized as a valid package in the repository.'
			);
			expect( validatedEntry.data.scope ).toEqual( [] );
		} );

		it( 'should return valid when scope is a valid package', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'ckeditor5-engine' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.scope ).toEqual( [ 'ckeditor5-engine' ] );
		} );

		it( 'should validate multiple scopes but remain valid even if some are invalid', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'ckeditor5-engine', 'unknown-package' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'Scope "unknown-package" is not recognized as a valid package in the repository.'
			);
			expect( validatedEntry.data.scope ).toEqual( [ 'ckeditor5-engine' ] );
		} );

		it( 'should skip scope validation for scopes when singlePackage is true', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', scope: [ 'ckeditor5-engine', 'unknown-package' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, true );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).not.toContain(
				'Scope "unknown-package" is not recognized as a valid package in the repository.'
			);
			expect( validatedEntry.data.scope ).toEqual( [ 'ckeditor5-engine', 'unknown-package' ] );
		} );
	} );

	describe( 'see validation', () => {
		it( 'should add validation message but remain valid when see is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'invalid-issue-reference' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'See "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( validatedEntry.data.see ).toEqual( [] );
		} );

		it( 'should return valid when see is an issue number', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ '1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.see ).toEqual( [ '1234' ] );
		} );

		it( 'should return valid when see is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'ckeditor/ckeditor5#1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.see ).toEqual( [ 'ckeditor/ckeditor5#1234' ] );
		} );

		it( 'should return valid when see is a full issue URL', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.see ).toEqual( [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] );
		} );

		it( 'should filter out invalid see references while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', see: [ 'invalid-reference', '1234', 'ckeditor/ckeditor5#5678' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'See "invalid-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( validatedEntry.data.see ).toEqual( [ '1234', 'ckeditor/ckeditor5#5678' ] );
		} );
	} );

	describe( 'closes validation', () => {
		it( 'should add validation message but remain valid when closes is not a valid issue reference', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', closes: [ 'invalid-issue-reference' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'Closes "invalid-issue-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( validatedEntry.data.closes ).toEqual( [] );
		} );

		it( 'should return valid when closes is an issue number', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', closes: [ '1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.closes ).toEqual( [ '1234' ] );
		} );

		it( 'should return valid when closes is a repository-slug#id', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', closes: [ 'ckeditor/ckeditor5#1234' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.closes ).toEqual( [ 'ckeditor/ckeditor5#1234' ] );
		} );

		it( 'should return valid when closes is a full issue URL', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				closes: [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.closes ).toEqual( [ 'https://github.com/ckeditor/ckeditor5/issues/1234' ] );
		} );

		it( 'should filter out invalid closes references while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				closes: [ 'invalid-reference', '1234', 'ckeditor/ckeditor5#5678' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'Closes "invalid-reference" is not a valid issue reference. ' +
				'Provide either: issue number, repository-slug#id or full issue link URL.'
			);
			expect( validatedEntry.data.closes ).toEqual( [ '1234', 'ckeditor/ckeditor5#5678' ] );
		} );
	} );

	describe( 'communityCredits validation', () => {
		it( 'should add validation message but remain valid when community username is not valid GitHub username', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', communityCredits: [ '@i n v a l i d n a m e' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'Community username "@i n v a l i d n a m e" is not valid GitHub username.'
			);
			expect( validatedEntry.data.communityCredits ).toEqual( [] );
		} );

		it( 'should return valid when community username is valid GitHub username', () => {
			const entry: ParsedFile = createEntry( { type: 'Feature', communityCredits: [ '@exampleName123' ] } );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.communityCredits ).toEqual( [ '@exampleName123' ] );
		} );

		it( 'should filter out invalid community usernames while keeping valid ones', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				communityCredits: [ '@i n v a l i d n a m e', '@exampleName123' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.validations ).toContain(
				'Community username "@i n v a l i d n a m e" is not valid GitHub username.'
			);
			expect( validatedEntry.data.communityCredits ).toEqual( [ '@exampleName123' ] );
		} );
	} );

	describe( 'multiple validations', () => {
		it( 'should collect multiple validation errors but only mark as invalid for critical errors', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Unknown',
				scope: [ 'unknown-package' ],
				see: [ 'invalid-reference' ],
				closes: [ 'invalid-reference' ],
				communityCredits: [ '@i n v a l i d n a m e' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeFalsy();
			expect( validatedEntry.data.validations?.length ).toBe( 5 );
			expect( validatedEntry.data.scope ).toEqual( [] );
			expect( validatedEntry.data.see ).toEqual( [] );
			expect( validatedEntry.data.closes ).toEqual( [] );
			expect( validatedEntry.data.communityCredits ).toEqual( [] );
		} );

		it( 'should return valid for a completely valid entry', () => {
			const entry: ParsedFile = createEntry( {
				type: 'Feature',
				scope: [ 'ckeditor5-engine' ],
				see: [ '1234' ],
				closes: [ 'ckeditor/ckeditor5#5678' ],
				communityCredits: [ '@exampleName123' ]
			} );

			const { isValid, validatedEntry } = validateEntry( entry, packageNames, false );

			expect( isValid ).toBeTruthy();
			expect( validatedEntry.data.scope ).toEqual( [ 'ckeditor5-engine' ] );
			expect( validatedEntry.data.see ).toEqual( [ '1234' ] );
			expect( validatedEntry.data.closes ).toEqual( [ 'ckeditor/ckeditor5#5678' ] );
		} );
	} );
} );
