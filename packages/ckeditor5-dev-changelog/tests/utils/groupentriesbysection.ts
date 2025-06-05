/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupEntriesBySection } from '../../src/utils/groupentriesbysection.js';
import type { ParsedFile } from '../../src/types.js';
import { validateEntry } from '../../src/utils/validateentry.js';

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

vi.mock( '../../src/utils/linktogithubuser', () => ( {
	linkToGitHubUser: vi.fn( content => content )
} ) );

vi.mock( '../../src/utils/validateentry' );

const createParsedFile = ( overrides: RecursivePartial<ParsedFile> = {} ): ParsedFile => ( {
	content: 'Some content',
	gitHubUrl: 'https://github.com/ckeditor',
	skipLinks: false,
	changesetPath: 'path/to/changeset',
	...overrides,
	data: {
		type: 'Feature',
		scope: [ 'package-1' ],
		closes: [ '123' ],
		see: [ '456' ],
		validations: [],
		communityCredits: [],
		...overrides.data
	}
} as any );

describe( 'groupEntriesBySection()', () => {
	const isSinglePackage = false;
	let transformScope: ( name: string ) => { displayName: string; npmUrl: string };
	let packagesMetadata: Map<string, string>;

	beforeEach( () => {
		transformScope = vi.fn( name => ( {
			displayName: `DisplayName-${ name }`,
			npmUrl: `https://npmjs.com/package/${ name }`
		} ) );

		packagesMetadata = new Map( [
			[ '@ckeditor/package-1', '1.0.0' ],
			[ '@ckeditor/package-2', '1.0.0' ]
		] );

		vi.mocked( validateEntry ).mockImplementation( entry => {
			const data = entry.data! || {};

			const see = ( data.see || [] ).filter( entry => !entry.startsWith( 'invalid' ) );
			const closes = ( data.closes || [] ).filter( entry => !entry.startsWith( 'invalid' ) );
			let validations = undefined;

			if ( see.length || closes.length ) {
				validations = [
					'Invalid references.'
				];
			}

			return {
				validatedEntry: {
					...entry,
					data: {
						...data,
						see,
						closes,
						validations
					}
				},
				isValid: true
			} as any;
		} );

		vi.clearAllMocks();
	} );

	it( 'should correctly classify files into sections', () => {
		const files = [
			createParsedFile( { data: { type: 'Major breaking change' } } ),
			createParsedFile( { data: { type: 'Fix' } } ),
			createParsedFile( { data: { type: 'Other' } } )
		];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		expect( result.major.entries ).toHaveLength( 1 );
		expect( result.fix.entries ).toHaveLength( 1 );
		expect( result.other.entries ).toHaveLength( 1 );
	} );

	it( 'should correctly classify generic breaking changes', () => {
		const files = [
			createParsedFile( { data: { type: 'Breaking change' } } )
		];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage: true } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 1 );
		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should classify generic breaking changes in monorepo as invalid', () => {
		const files = [
			createParsedFile( { data: { type: 'Breaking change' } } )
		];

		const testFile = files[ 0 ]!;
		const testData = testFile.data as any;
		vi.mocked( validateEntry ).mockReturnValueOnce( {
			validatedEntry: {
				...testFile,
				data: {
					...testData
				}
			},
			isValid: false
		} );

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 0 );
		expect( result.invalid.entries ).toHaveLength( 1 );
	} );

	it( 'should cast minor and major breaking changes to a generic ones in single packages', () => {
		const files = [
			createParsedFile( { data: { type: 'Minor breaking change' } } ),
			createParsedFile( { data: { type: 'Major breaking change' } } )
		];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage: true } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 2 );
		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should classify minor breaking change in a monorepo', () => {
		const files = [
			createParsedFile( { data: { type: 'Minor breaking change' } } )
		];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage: false } );

		expect( result.major.entries ).toHaveLength( 0 );
		expect( result.minor.entries ).toHaveLength( 1 );
		expect( result.breaking.entries ).toHaveLength( 0 );
		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should classify major breaking change in a monorepo', () => {
		const files = [
			createParsedFile( { data: { type: 'Major breaking change' } } )
		];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage: false } );

		expect( result.major.entries ).toHaveLength( 1 );
		expect( result.minor.entries ).toHaveLength( 0 );
		expect( result.breaking.entries ).toHaveLength( 0 );
		expect( result.invalid.entries ).toHaveLength( 0 );
	} );

	it( 'should not include see and closes when they are undefined', () => {
		const files = [ createParsedFile( {
			data: {
				see: [],
				closes: []
			}
		} ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'Closes [#123](https://github.com/ckeditor/issues/123).' );
		expect( message ).not.toContain( 'See [#456](https://github.com/ckeditor/issues/456).' );
	} );

	it( 'should classify an entry as valid if the scope is undefined', () => {
		const files = [ createParsedFile( {
			data: {
				scope: []
			}
		} ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		expect( result.invalid.entries ).toHaveLength( 0 );
		expect( result.feature.entries ).toHaveLength( 1 );
	} );

	it( 'should handle an empty files array', () => {
		const result = groupEntriesBySection( { files: [], packagesMetadata, transformScope, isSinglePackage } );

		Object.values( result ).forEach( section => expect( section.entries ).toHaveLength( 0 ) );
	} );

	it( 'should generate correct markdown links for scope and issues from the current repository', () => {
		const files = [ createParsedFile() ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toContain( '[DisplayName-package-1](https://npmjs.com/package/package-1)' );
		expect( message ).toContain( 'Closes [#123](https://github.com/ckeditor/issues/123).' );
		expect( message ).toContain( 'See [#456](https://github.com/ckeditor/issues/456).' );
	} );

	it( 'should generate correct markdown links for issues from other repositories', () => {
		const files = [ createParsedFile( { data: {
			closes: [ 'ckeditor/ckeditor5#123' ],
			see: [ 'mr-developer/cool-project.com#456' ]
		} } ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toContain(
			'Closes [ckeditor/ckeditor5#123](https://github.com/ckeditor/ckeditor5/issues/123).'
		);
		expect( message ).toContain(
			'See [mr-developer/cool-project.com#456](https://github.com/mr-developer/cool-project.com/issues/456).'
		);
	} );

	it( 'should generate correct markdown links for GitHub issues with URL format', () => {
		const files = [ createParsedFile( { data: {
			closes: [ 'https://github.com/ckeditor/ckeditor5/issues/123' ]
		} } ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		expect( result.feature.entries.length ).toEqual( 1 );
		expect( result.invalid.entries.length ).toEqual( 0 );
	} );

	it( 'should skip links when skipLinks is true', () => {
		const files = [ createParsedFile( { shouldSkipLinks: true } ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'Closes [#123]' );
		expect( message ).not.toContain( 'See [#456]' );
	} );

	it( 'should not add invalid links to the generated message', () => {
		const files = [ createParsedFile( { data: {
			closes: [ '@https://github.com/ckeditor/ckeditor5/issues/123' ]
		} } ) ];

		const testFile = files[ 0 ]!;
		const testData = testFile.data as any;
		vi.mocked( validateEntry ).mockReturnValueOnce( {
			validatedEntry: {
				...testFile,
				data: {
					...testData,
					see: testData.see
				}
			},
			isValid: false
		} );

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.invalid.entries[ 0 ]!.message;

		expect( message ).not.toContain( '@https://github.com/ckeditor/ckeditor5/issues/123' );
	} );

	it( 'should format the content properly', () => {
		const files = [ createParsedFile( { content: 'Some content.\n\nSecond line.\n\nThird line.' } ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).toEqual( [
			// eslint-disable-next-line @stylistic/max-len
			'* **[DisplayName-package-1](https://npmjs.com/package/package-1)**: Some content. See [#456](https://github.com/ckeditor/issues/456). Closes [#123](https://github.com/ckeditor/issues/123).',
			'',
			'  Second line.',
			'',
			'  Third line.'
		].join( '\n' ) );
	} );

	it( 'should handle invalid issue references that do not match any pattern (closes)', () => {
		const files = [ createParsedFile( { data: {
			closes: [ 'invalid-reference' ]
		} } ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'Closes' );
	} );

	it( 'should handle invalid issue references that do not match any pattern (see)', () => {
		const files = [ createParsedFile( { data: {
			see: [ 'invalid-reference' ]
		} } ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		const message = result.feature.entries[ 0 ]!.message;

		expect( message ).not.toContain( 'See' );
	} );

	it( 'should include the partial valid entry in the "warning" section (checking `closes`)', () => {
		const files = [ createParsedFile( {
			data: {
				type: 'Other',
				closes: [ 'invalid-reference' ]
			}
		} ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		expect( result.other.entries ).toHaveLength( 1 );
		expect( result.warning.entries ).toHaveLength( 1 );
	} );

	it( 'should include the partial valid entry in the "warning" section (checking `see`)', () => {
		const files = [ createParsedFile( {
			data: {
				see: [ 'invalid-reference' ]
			}
		} ) ];

		const result = groupEntriesBySection( { files, packagesMetadata, transformScope, isSinglePackage } );

		expect( result.feature.entries ).toHaveLength( 1 );
		expect( result.warning.entries ).toHaveLength( 1 );
	} );
} );
