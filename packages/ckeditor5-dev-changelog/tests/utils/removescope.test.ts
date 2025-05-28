/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../../src/types.js';
import { removeScope } from '../../src/utils/removescope.js';
import { describe, it, expect } from 'vitest';

describe( 'removeScope()', () => {
	it( 'should strip the scope from the data', () => {
		const parsedChangesetFiles: Array<ParsedFile> = [ {
			skipLinks: true,
			changesetPath: 'changesetPath1',
			gitHubUrl: 'gitHubUrl1',
			content: 'content1',
			data: {
				type: 'type1',
				scope: [ 'scope1' ]
			}
		}, {
			skipLinks: true,
			changesetPath: 'changesetPath2',
			gitHubUrl: 'gitHubUrl2',
			content: 'content2',
			data: {
				type: 'type2',
				scope: [ 'scope2' ]
			}
		} ];

		const result = removeScope( parsedChangesetFiles );

		expect( result ).toEqual( [ {
			skipLinks: true,
			changesetPath: 'changesetPath1',
			gitHubUrl: 'gitHubUrl1',
			content: 'content1',
			data: {
				type: 'type1'
			}
		}, {
			skipLinks: true,
			changesetPath: 'changesetPath2',
			gitHubUrl: 'gitHubUrl2',
			content: 'content2',
			data: {
				type: 'type2'
			}
		} ] );
	} );

	it( 'should not mutate the original object', () => {
		const parsedChangesetFiles: Array<ParsedFile> = [ {
			skipLinks: true,
			changesetPath: 'changesetPath1',
			gitHubUrl: 'gitHubUrl1',
			content: 'content1',
			data: {
				type: 'type1',
				scope: [ 'scope1' ]
			}
		}, {
			skipLinks: true,
			changesetPath: 'changesetPath2',
			gitHubUrl: 'gitHubUrl2',
			content: 'content2',
			data: {
				type: 'type2',
				scope: [ 'scope2' ]
			}
		} ];

		const parsedChangesetFilesClone = JSON.parse( JSON.stringify( parsedChangesetFiles ) );

		removeScope( parsedChangesetFiles );

		expect( parsedChangesetFiles ).toEqual( parsedChangesetFilesClone );
	} );
} );
