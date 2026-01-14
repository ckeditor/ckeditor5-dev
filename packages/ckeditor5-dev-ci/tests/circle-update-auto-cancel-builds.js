/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import circleUpdateAutoCancelBuilds from '../lib/circle-update-auto-cancel-builds.js';

describe( 'lib/circleUpdateAutoCancelBuilds', () => {
	it( 'should send a request to CircleCI to update the redundant workflows option', async () => {
		const response = { foo: 'bar' };

		const fetchMock = vi.fn();
		vi.stubGlobal( 'fetch', fetchMock );

		fetchMock.mockResolvedValue( { json: () => Promise.resolve( response ) } );

		const results = await circleUpdateAutoCancelBuilds( {
			circleToken: 'circle-token',
			githubOrganization: 'ckeditor',
			githubRepository: 'ckeditor5-foo',
			newValue: true
		} );

		expect( results ).to.deep.equal( response );

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledWith(
			'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-foo/settings',
			{
				method: 'PATCH',
				headers: {
					'Circle-Token': 'circle-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					advanced: {
						'autocancel_builds': true
					}
				} )
			}
		);
	} );
} );
