/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getJobApprover from '../../lib/utils/get-job-approver.js';

describe( 'lib/utils/getJobApprover', () => {
	it( 'should return a GitHub login name of a user who approved a job in given workflow', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal( 'fetch', fetchMock );

		fetchMock
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

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenNthCalledWith( 1,
			'https://circleci.com/api/v2/workflow/abc-123-abc-456/job',
			{
				'method': 'GET',
				'headers': expect.objectContaining( {
					'Circle-Token': 'circle-token'
				} )
			}
		);
		expect( vi.mocked( fetchMock ) ).toHaveBeenNthCalledWith( 2,
			'https://circleci.com/api/v2/user/foo-unique-id',
			{
				'method': 'GET',
				'headers': expect.objectContaining( {
					'Circle-Token': 'circle-token'
				} )
			}
		);
	} );
} );
