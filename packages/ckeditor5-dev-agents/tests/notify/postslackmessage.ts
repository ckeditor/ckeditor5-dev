/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import { postSlackMessage } from '../../src/notify/postslackmessage.js';

describe( 'postSlackMessage()', () => {
	let fetchMock: Mock;

	beforeEach( () => {
		fetchMock = vi.fn( async () => new Response( 'ok' ) );
		vi.stubGlobal( 'fetch', fetchMock );
	} );

	it( 'posts the text to the webhook as JSON, with a timeout', async () => {
		await postSlackMessage( 'https://hooks.slack/x', 'Hello *there*.' );

		const [ url, init ] = fetchMock.mock.calls[ 0 ]!;

		expect( url ).toBe( 'https://hooks.slack/x' );
		expect( init ).toMatchObject( { method: 'POST', headers: { 'content-type': 'application/json' } } );
		expect( JSON.parse( init.body ) ).toEqual( { text: 'Hello *there*.' } );
		expect( init.signal ).toBeInstanceOf( AbortSignal );
	} );

	it( 'throws with the status and the answer of Slack when the request is rejected', async () => {
		fetchMock.mockResolvedValueOnce( new Response( 'no_service\n', { status: 404 } ) );

		await expect( postSlackMessage( 'https://hooks.slack/x', 'Hi.' ) )
			.rejects.toThrow( 'The Slack webhook responded with status 404: no_service' );
	} );
} );
