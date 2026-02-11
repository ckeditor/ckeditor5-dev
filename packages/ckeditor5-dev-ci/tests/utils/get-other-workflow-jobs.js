/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getOtherWorkflowJobs from '../../lib/utils/get-other-workflow-jobs.js';

describe( 'lib/utils/getOtherWorkflowJobs', () => {
	it( 'returns all workflow jobs except the current one', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValue( {
				ok: true,
				status: 200,
				json: () => Promise.resolve( {
					items: [
						{ name: 'job-a', status: 'success' },
						{ name: 'notifier', status: 'running' },
						{ name: 'job-b', status: 'blocked' }
					]
				} )
			} );

		vi.stubGlobal( 'fetch', fetchMock );

		const jobs = await getOtherWorkflowJobs( {
			circleToken: 'circle-token',
			workflowId: 'abc-123',
			currentJobName: 'notifier'
		} );

		expect( jobs ).toEqual( [
			{ name: 'job-a', status: 'success' },
			{ name: 'job-b', status: 'blocked' }
		] );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledWith(
			'https://circleci.com/api/v2/workflow/abc-123/job',
			{
				method: 'GET',
				headers: {
					'Circle-Token': 'circle-token'
				}
			}
		);
	} );

	it( 'retries transient errors and eventually succeeds', async () => {
		const fetchMock = vi.fn();
		const warnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );

		vi.stubGlobal( 'fetch', fetchMock );

		fetchMock
			.mockResolvedValueOnce( {
				ok: true,
				status: 200,
				json: () => Promise.resolve( {
					message: 'Temporary backend issue'
				} )
			} )
			.mockResolvedValueOnce( {
				ok: true,
				status: 200,
				json: () => Promise.resolve( {
					items: [
						{ name: 'job-a', status: 'success' },
						{ name: 'notifier', status: 'running' }
					]
				} )
			} );

		const jobs = await getOtherWorkflowJobs( {
			circleToken: 'circle-token',
			workflowId: 'abc-123',
			currentJobName: 'notifier',
			retryDelayMs: 0,
			maxAttempts: 5
		} );

		expect( jobs ).toEqual( [
			{ name: 'job-a', status: 'success' }
		] );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 2 );
		expect( warnSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'fails after max retries when CircleCI API is unstable', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValue( {
				ok: true,
				status: 200,
				json: () => Promise.resolve( {
					message: 'No items in payload'
				} )
			} );
		const warnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );

		vi.stubGlobal( 'fetch', fetchMock );

		await expect( getOtherWorkflowJobs( {
			circleToken: 'circle-token',
			workflowId: 'abc-123',
			currentJobName: 'notifier',
			retryDelayMs: 0,
			maxAttempts: 5
		} ) ).rejects.toThrow(
			'CircleCI API seems unstable. Failed to fetch workflow jobs after 5 attempts.'
		);

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 5 );
		expect( warnSpy ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'fails immediately for non-retryable statuses', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValue( {
				ok: false,
				status: 401,
				json: () => Promise.resolve( {
					message: 'Unauthorized'
				} )
			} );

		vi.stubGlobal( 'fetch', fetchMock );

		await expect( getOtherWorkflowJobs( {
			circleToken: 'circle-token',
			workflowId: 'abc-123',
			currentJobName: 'notifier',
			retryDelayMs: 0,
			maxAttempts: 5
		} ) ).rejects.toThrow( 'CircleCI API request failed with a non-retryable status (401: Unauthorized).' );

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
	} );
} );
