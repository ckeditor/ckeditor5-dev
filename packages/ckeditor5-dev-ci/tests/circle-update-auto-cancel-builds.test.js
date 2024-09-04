/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import circleUpdateAutoCancelBuilds from '../lib/circle-update-auto-cancel-builds';
import nodeFetch from 'node-fetch';

vi.mock( 'node-fetch' );

describe( 'lib/circleUpdateAutoCancelBuilds', () => {
	it( 'should send a request to CircleCI to update the redundant workflows option', async () => {
		const response = {};

		vi.mocked( nodeFetch )
			.mockResolvedValue( {
				json: () => Promise.resolve( response )
			} );

		const results = await circleUpdateAutoCancelBuilds( {
			circleToken: 'circle-token',
			githubOrganization: 'ckeditor',
			githubRepository: 'ckeditor5-foo',
			newValue: true
		} );

		expect( vi.mocked( nodeFetch ) ).toHaveBeenCalledTimes( 1 );
		expect( results ).to.deep.equal( response );

		const [ url, options ] = vi.mocked( nodeFetch ).mock.calls[ 0 ];

		expect( url ).to.equal( 'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-foo/settings' );
		expect( options ).to.have.property( 'method', 'patch' );
		expect( options ).to.have.property( 'headers' );
		expect( options.headers ).to.have.property( 'Circle-Token', 'circle-token' );
		expect( options ).to.have.property( 'body' );

		const body = JSON.parse( options.body );
		expect( body ).to.have.property( 'advanced' );
		expect( body.advanced ).to.have.property( 'autocancel_builds', true );
	} );
} );
