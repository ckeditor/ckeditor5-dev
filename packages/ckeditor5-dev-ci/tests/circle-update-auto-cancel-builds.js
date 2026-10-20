/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import circleUpdateAutoCancelBuilds from '../lib/circle-update-auto-cancel-builds.js';

describe( 'lib/circleUpdateAutoCancelBuilds', () => {
	let fetchMock;

	const options = {
		circleToken: 'circle-token',
		githubOrganization: 'ckeditor',
		githubRepository: 'ckeditor5-foo',
		newValue: true
	};

	beforeEach( () => {
		fetchMock = vi.fn();
		vi.stubGlobal( 'fetch', fetchMock );
	} );

	it( 'should send a request to CircleCI to update the redundant workflows option', async () => {
		const response = { foo: 'bar' };

		fetchMock.mockResolvedValue( createResponse( { ok: true, status: 200, body: JSON.stringify( response ) } ) );

		const results = await circleUpdateAutoCancelBuilds( options );

		expect( results ).to.deep.equal( response );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		expect( fetchMock ).toHaveBeenCalledWith(
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

	it( 'should reject when CircleCI responds with a non-2xx status and a JSON message', async () => {
		fetchMock.mockResolvedValue( createResponse( {
			ok: false,
			status: 403,
			body: JSON.stringify( { message: 'Permission denied' } )
		} ) );

		await expect( circleUpdateAutoCancelBuilds( options ) ).rejects.toThrow(
			'CircleCI rejected the request to update the "Auto-cancel redundant workflows" option ' +
			'for "ckeditor/ckeditor5-foo" (403: Permission denied). ' +
			'Verify the CircleCI token and its permissions to the project.'
		);
	} );

	it( 'should reject when CircleCI responds with a non-2xx status and a non-JSON body', async () => {
		fetchMock.mockResolvedValue( createResponse( { ok: false, status: 502, body: 'Bad Gateway' } ) );

		await expect( circleUpdateAutoCancelBuilds( options ) ).rejects.toThrow( '(502: Bad Gateway)' );
	} );

	it( 'should reject when CircleCI responds with a non-2xx status and an empty body', async () => {
		fetchMock.mockResolvedValue( createResponse( { ok: false, status: 404, body: '' } ) );

		await expect( circleUpdateAutoCancelBuilds( options ) ).rejects.toThrow( '(404). ' );
	} );

	it( 'should reject when CircleCI responds with a non-2xx status and the body cannot be read', async () => {
		fetchMock.mockResolvedValue( {
			ok: false,
			status: 500,
			text: () => Promise.reject( new Error( 'Stream closed' ) )
		} );

		await expect( circleUpdateAutoCancelBuilds( options ) ).rejects.toThrow( '(500). ' );
	} );

	it( 'should reject when CircleCI responds with a JSON error using the "error" field', async () => {
		fetchMock.mockResolvedValue( createResponse( { ok: false, status: 400, body: '{"error":"Bad request"}' } ) );

		await expect( circleUpdateAutoCancelBuilds( options ) ).rejects.toThrow( '(400: Bad request)' );
	} );

	it( 'should reject when the request fails due to a network error', async () => {
		fetchMock.mockRejectedValue( new Error( 'fetch failed' ) );

		await expect( circleUpdateAutoCancelBuilds( options ) ).rejects.toThrow( 'fetch failed' );
	} );
} );

function createResponse( { ok, status, body } ) {
	return {
		ok,
		status,
		text: () => Promise.resolve( body ),
		json: () => Promise.resolve( JSON.parse( body ) )
	};
}
