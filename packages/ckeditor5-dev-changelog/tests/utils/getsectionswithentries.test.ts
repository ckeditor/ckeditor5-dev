/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSectionsWithEntries } from '../../src/utils/getsectionswithentries.js';
import { linkToGitHubUser } from '../../src/utils/external/linktogithubuser.js';
import type { ParsedFile, PackageJson } from '../../src/types.js';
import { validateEntry } from '../../src/utils/validateentry.js';

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

vi.mock( '../../src/utils/external/linktogithubuser', () => ( {
	linkToGitHubUser: vi.fn( content => content )
} ) );

vi.mock( '../../src/utils/validateentry', () => ( {
	validateEntry: vi.fn( entry => ( { validatedEntry: entry, isValid: true } ) )
} ) );

const createParsedFile = ( overrides: RecursivePartial<ParsedFile> = {} ): ParsedFile => ( {
	content: 'Some content',
	gitHubUrl: 'https://github.com/ckeditor',
	skipLinks: false,
	changesetPath: 'path/to/changeset',
	...overrides,
	data: {
		type: 'FEATURE',
		typeNormalized: 'Feature',
		scope: [ 'package-1' ],
		scopeNormalized: [ 'PACKAGE-1' ],
		closes: [ '123' ],
		closesNormalized: [ '123' ],
		see: [ '456' ],
		seeNormalized: [ '456' ],
		...overrides.data
	}
} as any );

describe( 'getSectionsWithEntries()', () => {
	const organisationNamespace = '@ckeditor';
	const singlePackage = false;
	let transformScope: ( name: string ) => { displayName: string; npmUrl: string };
	let packageJsons: Array<PackageJson>;

	beforeEach( () => {
		transformScope = vi.fn( name => ( {
			displayName: `DisplayName-${ name }`,
			npmUrl: `https://npmjs.com/package/${ name }`
		} ) );

		packageJsons = [
			{ name: `${ organisationNamespace }/package-1`, version: '1.0.0' },
			{ name: `${ organisationNamespace }/package-2`, version: '1.0.0' }
		];

		vi.clearAllMocks();
	} );

	it( 'should correctly classify parsedFiles into sections', () => {
		const parsedFiles = [
			createParsedFile( { data: { 'breaking-change': 'major', breakingChangeNormalized: 'major' } } ),
			createParsedFile( { data: { type: 'Fix', typeNormalized: 'Fix' } } ),
			createParsedFile( { data: { type: 'Other', typeNormalized: 'Other' } } )
		];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		expect( result.major.entries ).toHaveLength( 1 );
		expect( result.fix.entries ).toHaveLength( 1 );
		expect( result.other.entries ).toHaveLength( 1 );
	} );

	it( 'should correctly classify generic breaking changes', () => {
		const parsedFiles = [
			createParsedFile( { data: { 'breaking-change': true, breakingChangeNormalized: true } } )
		];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage: true } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 1 );
		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should classify generic breaking changes in monorepo as invalid', () => {
		const parsedFiles = [
			createParsedFile( {
				data: {
					'breaking-change': true,
					breakingChangeNormalized: true,
					typeNormalized: 'Feature'
				}
			} )
		];

		// For this test, we need to override the validation mock to mark the entry as invalid.
		vi.mocked( validateEntry ).mockReturnValueOnce( {
			validatedEntry: parsedFiles[ 0 ] as ParsedFile,
			isValid: false
		} );

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 0 );
		expect( result.invalid.entries ).toHaveLength( 1 );
	} );

	it( 'should cast minor and major breaking changes to a generic ones in single packages', () => {
		const parsedFiles = [
			createParsedFile( { data: { 'breaking-change': 'minor', breakingChangeNormalized: 'minor' } } ),
			createParsedFile( { data: { 'breaking-change': 'major', breakingChangeNormalized: 'major' } } )
		];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage: true } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 2 );
		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should classify an entry with an unknown type as invalid', () => {
		const parsedFiles = [ createParsedFile( { data: { type: 'UnknownType', typeNormalized: 'UnknownType' } } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		expect( result.invalid.entries ).toHaveLength( 1 );
	} );

	it( 'should not include see and closes when they are undefined', () => {
		const parsedFiles = [ createParsedFile( {
			data: {
				see: undefined,
				seeNormalized: undefined,
				closes: undefined,
				closesNormalized: undefined
			}
		} ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'Closes [#123](https://github.com/ckeditor/issues/123).' );
		expect( message ).not.toContain( 'See [#456](https://github.com/ckeditor/issues/456).' );
	} );

	it( 'should classify an entry as valid if the scope is undefined', () => {
		const parsedFiles = [ createParsedFile( { data: { scope: undefined, scopeNormalized: undefined } } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		expect( result.invalid.entries ).toHaveLength( 0 );
		expect( result.feature.entries ).toHaveLength( 1 );
	} );

	it( 'should handle an empty parsedFiles array', () => {
		const result = getSectionsWithEntries( { parsedFiles: [], packageJsons, transformScope, singlePackage } );

		Object.values( result ).forEach( section => expect( section.entries ).toBeUndefined );
	} );

	it( 'should generate correct markdown links for scope and issues from the current repository', () => {
		const parsedFiles = [ createParsedFile() ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toContain( '[DisplayName-package-1](https://npmjs.com/package/package-1)' );
		expect( message ).toContain( 'Closes [#123](https://github.com/ckeditor/issues/123).' );
		expect( message ).toContain( 'See [#456](https://github.com/ckeditor/issues/456).' );
	} );

	it( 'should generate correct markdown links for issues from other repositories', () => {
		const parsedFiles = [ createParsedFile( { data: {
			closes: [ 'ckeditor/ckeditor5#123' ],
			closesNormalized: [ 'ckeditor/ckeditor5#123' ],
			see: [ 'mr-developer/cool-project.com#456' ],
			seeNormalized: [ 'mr-developer/cool-project.com#456' ]
		} } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toContain(
			'Closes [ckeditor/ckeditor5#123](https://github.com/ckeditor/ckeditor5/issues/123).'
		);
		expect( message ).toContain(
			'See [mr-developer/cool-project.com#456](https://github.com/mr-developer/cool-project.com/issues/456).'
		);
	} );

	it( 'should generate correct markdown links for GitHub issues with URL format', () => {
		const parsedFiles = [ createParsedFile( { data: {
			closes: [ 'https://github.com/ckeditor/ckeditor5/issues/123' ],
			closesNormalized: [ 'https://github.com/ckeditor/ckeditor5/issues/123' ]
		} } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toContain(
			'Closes [ckeditor/ckeditor5#123](https://github.com/ckeditor/ckeditor5/issues/123).'
		);
	} );

	it( 'should skip links when skipLinks is true', () => {
		const parsedFiles = [ createParsedFile( { skipLinks: true } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'Closes [#123]' );
		expect( message ).not.toContain( 'See [#456]' );
	} );

	it( 'should format the content properly', () => {
		const parsedFiles = [ createParsedFile( { content: 'Some content.\n\nSecond line.\n\nThird line.' } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toEqual( [
			// eslint-disable-next-line max-len
			'* **[DisplayName-package-1](https://npmjs.com/package/package-1)**: Some content. See [#456](https://github.com/ckeditor/issues/456). Closes [#123](https://github.com/ckeditor/issues/123).',
			'',
			'  Second line.',
			'',
			'  Third line.'
		].join( '\n' ) );
	} );

	it( 'should call linkToGitHubUser correctly', () => {
		const parsedFiles = [ createParsedFile( { content: 'Some content' } ) ];

		getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage } );

		expect( linkToGitHubUser ).toHaveBeenCalledWith( 'Some content' );
	} );
} );
