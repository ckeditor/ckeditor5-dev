/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSectionsWithEntries } from '../../src/utils/getsectionswithentries.js';
import { linkToGitHubUser } from '../../src/utils/external/linktogithubuser.js';
import type { ParsedFile, PackageJson } from '../../src/types.js';

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

vi.mock( '../../src/utils/external/linktogithubuser', () => ( {
	linkToGitHubUser: vi.fn( content => content )
} ) );

const createParsedFile = ( overrides: RecursivePartial<ParsedFile> = {} ): ParsedFile => ( {
	content: 'Some content',
	gitHubUrl: 'https://github.com/ckeditor',
	...overrides,
	data: {
		type: 'Feature',
		scope: [ 'package-1' ],
		closes: [ '123' ],
		see: [ '456' ],
		...overrides.data
	}
} as any );

describe( 'getSectionsWithEntries', () => {
	const organisationNamespace = '@ckeditor';
	let transformScope: ( name: string ) => { displayName: string; npmUrl: string };
	let packages: Array<PackageJson>;

	beforeEach( () => {
		transformScope = vi.fn( name => ( {
			displayName: `DisplayName-${ name }`,
			npmUrl: `https://npmjs.com/package/${ name }`
		} ) );

		packages = [
			{ name: `${ organisationNamespace }/package-1`, version: '1.0.0' },
			{ name: `${ organisationNamespace }/package-2`, version: '1.0.0' }
		];
	} );

	it( 'should correctly classify parsedFiles into sections', () => {
		const parsedFiles = [
			createParsedFile( { data: { 'breaking-change': 'major' } } ),
			createParsedFile( { data: { type: 'Fix' } } ),
			createParsedFile( { data: { type: 'Other' } } )
		];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		expect( result.major.entries ).toHaveLength( 1 );
		expect( result.fix.entries ).toHaveLength( 1 );
		expect( result.other.entries ).toHaveLength( 1 );
	} );

	it( 'should classify an entry with an unknown type as invalid', () => {
		const parsedFiles = [ createParsedFile( { data: { type: 'UnknownType' as any } } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		expect( result.invalid.entries ).toHaveLength( 1 );
	} );

	it( 'should not include see and closes when they are undefined', () => {
		const parsedFiles = [ createParsedFile( { data: { see: undefined, closes: undefined } } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'Closes [#123](https://github.com/ckeditor/issues/123).' );
		expect( message ).not.toContain( 'See [#456](https://github.com/ckeditor/issues/456).' );
	} );

	it( 'should classify an entry as invalid if the scope is not recognized', () => {
		const parsedFiles = [ createParsedFile( { data: { scope: [ 'unknown-package' ] } } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		expect( result.invalid.entries ).toHaveLength( 1 );
	} );

	it( 'should classify an entry as valid if the scope is not undefined', () => {
		const parsedFiles = [ createParsedFile( { data: { scope: undefined } } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should handle an empty parsedFiles array', () => {
		const result = getSectionsWithEntries( { parsedFiles: [], packageJsons: packages, transformScope, organisationNamespace } );

		Object.values( result ).forEach( section => expect( section.entries ).toBeUndefined );
	} );

	it( 'should generate correct markdown links for scope and issues', () => {
		const parsedFiles = [ createParsedFile() ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toContain( '[DisplayName-package-1](https://npmjs.com/package/package-1)' );
		expect( message ).toContain( 'Closes [#123](https://github.com/ckeditor/issues/123).' );
		expect( message ).toContain( 'See [#456](https://github.com/ckeditor/issues/456).' );
	} );

	it( 'should format the content properly', () => {
		const parsedFiles = [ createParsedFile( { content: 'Some content\n\nSecond line\n\nThird line' } ) ];

		const result = getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toEqual( [
			'* **[DisplayName-package-1](https://npmjs.com/package/package-1)**: Some content ' +
				'See [#456](https://github.com/ckeditor/issues/456). ' +
				'Closes [#123](https://github.com/ckeditor/issues/123). ',
			'',
			'  Second line',
			'',
			'  Third line'
		].join( '\n' ) );
	} );

	it( 'should call linkToGitHubUser correctly', () => {
		const parsedFiles = [ createParsedFile( { content: 'Some content' } ) ];

		getSectionsWithEntries( { parsedFiles, packageJsons: packages, transformScope, organisationNamespace } );

		expect( linkToGitHubUser ).toHaveBeenCalledWith( 'Some content' );
	} );
} );
