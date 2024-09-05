/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getJobApprover from '../../lib/utils/get-job-approver';
import nodeFetch from 'node-fetch';

vi.mock( 'node-fetch' );

describe( 'lib/utils/getJobApprover', () => {
	it( 'should return a GitHub login name of a user who approved a job in given workflow', async () => {
		vi.mocked( nodeFetch )
			.mockResolvedValueOnce( {
				json: () => Promise.resolve( {
					items: [
						{ name: 'job-1' },
						{ name: 'job-2', approved_by: 'foo-unique-id' }
					]
				} )
			} )
			.mockResolvedValueOnce( {
				json: () => Promise.resolve( {
					login: 'foo'
				} )
			} );

		const login = await getJobApprover( 'circle-token', 'abc-123-abc-456', 'job-2' );

		expect( login ).to.equal( 'foo' );

		expect( vi.mocked( nodeFetch ) ).toHaveBeenCalledTimes( 2 );

		const [ firstUrl, firstOptions ] = vi.mocked( nodeFetch ).mock.calls[ 0 ];

		expect( firstUrl ).to.equal( 'https://circleci.com/api/v2/workflow/abc-123-abc-456/job' );
		expect( firstOptions ).to.have.property( 'method', 'get' );
		expect( firstOptions ).to.have.property( 'headers' );
		expect( firstOptions.headers ).to.have.property( 'Circle-Token', 'circle-token' );

		const [ secondUrl, secondOptions ] = vi.mocked( nodeFetch ).mock.calls[ 1 ];

		expect( secondUrl ).to.equal( 'https://circleci.com/api/v2/user/foo-unique-id' );
		expect( secondOptions ).to.have.property( 'method', 'get' );
		expect( secondOptions ).to.have.property( 'headers' );
		expect( secondOptions.headers ).to.have.property( 'Circle-Token', 'circle-token' );
	} );
} );
