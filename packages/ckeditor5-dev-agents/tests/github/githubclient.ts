/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, it, expect, vi, type Mock } from 'vitest';
import { createGitHubClient } from '../../src/github/githubclient.js';

describe( 'createGitHubClient()', () => {
	let fetchMock: Mock;

	const jsonResponse = ( data: unknown, status = 200 ) => {
		return new Response( JSON.stringify( data ), { status, headers: { 'content-type': 'application/json; charset=utf-8' } } );
	};

	beforeEach( () => {
		fetchMock = vi.fn( async () => jsonResponse( { number: 1, html_url: 'https://pr' } ) );
		vi.stubGlobal( 'fetch', fetchMock );
	} );

	const client = createGitHubClient( 'secret' );

	it( 'findOpenPullRequest() queries open pull requests from the branch of the owner, into any base', async () => {
		fetchMock.mockResolvedValueOnce( jsonResponse( [ { number: 7, html_url: 'https://pr/7' } ] ) );

		expect( await client.findOpenPullRequest( { slug: 'owner/repo', head: 'ai-tasks/t/x/stable' } ) )
			.toEqual( { number: 7, html_url: 'https://pr/7' } );

		const [ url, init ] = fetchMock.mock.calls[ 0 ]!;

		expect( url ).toBe( 'https://api.github.com/repos/owner/repo/pulls?state=open&head=owner%3Aai-tasks%2Ft%2Fx%2Fstable' );
		expect( init.method ).toBe( 'GET' );
		expect( init.signal ).toBeInstanceOf( AbortSignal );
		expect( init.headers ).toMatchObject( {
			'authorization': 'token secret',
			'x-github-api-version': '2026-03-10'
		} );
	} );

	it( 'findOpenPullRequest() returns `null` when there is none', async () => {
		fetchMock.mockResolvedValueOnce( jsonResponse( [] ) );

		expect( await client.findOpenPullRequest( { slug: 'owner/repo', head: 'h' } ) ).toBeNull();
	} );

	it( 'createPullRequest() posts the pull request', async () => {
		expect( await client.createPullRequest( { slug: 'owner/repo', head: 'h', base: 'b', title: 'T', body: 'B' } ) )
			.toEqual( { number: 1, html_url: 'https://pr' } );

		const [ url, init ] = fetchMock.mock.calls[ 0 ]!;

		expect( url ).toBe( 'https://api.github.com/repos/owner/repo/pulls' );
		expect( init.method ).toBe( 'POST' );
		expect( init.headers[ 'content-type' ] ).toBe( 'application/json; charset=utf-8' );
		expect( JSON.parse( init.body ) ).toEqual( { head: 'h', base: 'b', title: 'T', body: 'B' } );
	} );

	it( 'updatePullRequest() patches the description', async () => {
		expect( await client.updatePullRequest( { slug: 'owner/repo', number: 3, body: 'B' } ) )
			.toEqual( { number: 1, html_url: 'https://pr' } );

		const [ url, init ] = fetchMock.mock.calls[ 0 ]!;

		expect( url ).toBe( 'https://api.github.com/repos/owner/repo/pulls/3' );
		expect( init.method ).toBe( 'PATCH' );
		expect( JSON.parse( init.body ) ).toEqual( { body: 'B' } );
	} );

	it( 'createComment() posts an issue comment', async () => {
		await client.createComment( { slug: 'owner/repo', number: 3, body: 'C' } );

		const [ url, init ] = fetchMock.mock.calls[ 0 ]!;

		expect( url ).toBe( 'https://api.github.com/repos/owner/repo/issues/3/comments' );
		expect( init.method ).toBe( 'POST' );
		expect( JSON.parse( init.body ) ).toEqual( { body: 'C' } );
	} );

	it( 'throws with the request and the status when a request fails', async () => {
		fetchMock.mockResolvedValueOnce( jsonResponse( { message: 'Not Found' }, 404 ) );

		await expect( client.createComment( { slug: 'owner/repo', number: 3, body: 'C' } ) ).rejects.toThrow(
			'GitHub API request "POST https://api.github.com/repos/owner/repo/issues/3/comments" failed with status 404: Not Found'
		);
	} );

	it( 'throws with the request when a request times out', async () => {
		fetchMock.mockRejectedValueOnce( new DOMException( 'The operation was aborted due to timeout.', 'TimeoutError' ) );

		await expect( client.createComment( { slug: 'owner/repo', number: 3, body: 'C' } ) ).rejects.toThrow(
			'GitHub API request "POST https://api.github.com/repos/owner/repo/issues/3/comments" failed with status 500: ' +
			'The operation was aborted due to timeout.'
		);
	} );

	it( 'throws the error of an aborted request as it is', async () => {
		const abortError = new DOMException( 'The operation was aborted.', 'AbortError' );

		fetchMock.mockRejectedValueOnce( abortError );

		await expect( client.createComment( { slug: 'owner/repo', number: 3, body: 'C' } ) ).rejects.toBe( abortError );
	} );
} );
