/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import triggerCircleBuild from '../lib/trigger-circle-build.js';

describe( 'lib/triggerCircleBuild', () => {
	let fetchMock;

	beforeEach( () => {
		fetchMock = vi.fn();
		vi.stubGlobal( 'fetch', fetchMock );
	} );

	it( 'should send a POST request to the CircleCI service', async () => {
		vi.mocked( fetchMock ).mockResolvedValue( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev'
		} );

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledWith(
			'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-dev/pipeline',
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Circle-Token': 'circle-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					branch: 'master',
					parameters: {
						triggerCommitHash: 'abcd1234'
					}
				} )
			}
		);
	} );

	it( 'should include the "isRelease=true" parameter when passing the `releaseBranch` option (the same release branch)', async () => {
		vi.mocked( fetchMock ).mockResolvedValue( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev',
			releaseBranch: 'master'
		} );

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledWith(
			'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-dev/pipeline',
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Circle-Token': 'circle-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					branch: 'master',
					parameters: {
						triggerCommitHash: 'abcd1234',
						isRelease: true
					}
				} )
			}
		);
	} );

	it( 'should include the "isRelease=false" parameter when passing the `releaseBranch` option', async () => {
		vi.mocked( fetchMock ).mockResolvedValue( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev',
			releaseBranch: 'release'
		} );

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledWith(
			'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-dev/pipeline',
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Circle-Token': 'circle-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					branch: 'master',
					parameters: {
						triggerCommitHash: 'abcd1234',
						isRelease: false
					}
				} )
			}
		);
	} );

	it( 'should include the "triggerRepositorySlug" parameter when passing the `releaseBranch` option', async () => {
		vi.mocked( fetchMock ).mockResolvedValue( {
			json: () => Promise.resolve( {
				error_message: null
			} )
		} );

		await triggerCircleBuild( {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev',
			triggerRepositorySlug: 'ckeditor/ckeditor5'
		} );

		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fetchMock ) ).toHaveBeenCalledWith(
			'https://circleci.com/api/v2/project/github/ckeditor/ckeditor5-dev/pipeline',
			{
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Circle-Token': 'circle-token',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					branch: 'master',
					parameters: {
						triggerCommitHash: 'abcd1234',
						triggerRepositorySlug: 'ckeditor/ckeditor5'
					}
				} )
			}
		);
	} );

	it( 'should reject a promise when CircleCI responds with an error containing error_message property', async () => {
		vi.mocked( fetchMock ).mockResolvedValue( {
			json: () => Promise.resolve( {
				error_message: 'HTTP 404'
			} )
		} );

		const data = {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev'
		};

		return triggerCircleBuild( data )
			.then( () => {
				throw new Error( 'This error should not be thrown!' );
			} )
			.catch( err => {
				expect( err.message ).to.equal( 'CI trigger failed: "HTTP 404".' );
			} );
	} );

	it( 'should reject a promise when CircleCI responds with an error containing message property', async () => {
		vi.mocked( fetchMock ).mockResolvedValue( {
			json: () => Promise.resolve( {
				message: 'HTTP 404'
			} )
		} );

		const data = {
			circleToken: 'circle-token',
			commit: 'abcd1234',
			branch: 'master',
			repositorySlug: 'ckeditor/ckeditor5-dev'
		};

		return triggerCircleBuild( data )
			.then( () => {
				throw new Error( 'This error should not be thrown!' );
			} )
			.catch( err => {
				expect( err.message ).to.equal( 'CI trigger failed: "HTTP 404".' );
			} );
	} );
} );
