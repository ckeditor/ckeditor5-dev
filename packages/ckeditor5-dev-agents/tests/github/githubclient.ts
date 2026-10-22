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

	it( 'listOpenPullRequests() returns the open pull requests from matching branches of the repository itself', async () => {
		const pull = ( number: number, head: string, base: string, repoId = 1 ) => ( {
			number, html_url: `https://pr/${ number }`, head: { ref: head, repo: { id: repoId } }, base: { ref: base, repo: { id: 1 } }
		} );

		fetchMock.mockResolvedValueOnce( jsonResponse( [
			pull( 1, 'ai-tasks/t/x/stable', 'stable' ),
			pull( 2, 'feature', 'stable' ),
			pull( 3, 'ai-tasks/t/x/stable--2', 'ai-tasks/t/x/stable' ),
			pull( 4, 'ai-tasks/t/x/stable', 'stable', 2 ),
			{ ...pull( 5, 'ai-tasks/t/x/stable', 'stable' ), head: { ref: 'ai-tasks/t/x/stable', repo: null } }
		] ) );

		expect( await client.listOpenPullRequests( { slug: 'Owner/Repo', filter: head => head.startsWith( 'ai-tasks/' ) } ) ).toEqual( [
			{ number: 1, html_url: 'https://pr/1', head: 'ai-tasks/t/x/stable', base: 'stable' },
			{ number: 3, html_url: 'https://pr/3', head: 'ai-tasks/t/x/stable--2', base: 'ai-tasks/t/x/stable' }
		] );

		const [ url, init ] = fetchMock.mock.calls[ 0 ]!;

		expect( url ).toBe( 'https://api.github.com/repos/Owner/Repo/pulls?state=open&per_page=100' );
		expect( init.method ).toBe( 'GET' );
		expect( init.signal ).toBeInstanceOf( AbortSignal );
		expect( init.headers ).toMatchObject( {
			'authorization': 'token secret',
			'x-github-api-version': '2026-03-10'
		} );
	} );

	it( 'wasMerged() tells whether a closed pull request from the branch was merged', async () => {
		fetchMock.mockResolvedValueOnce( jsonResponse( [ { merged_at: null }, { merged_at: '2026-10-21T10:00:00Z' } ] ) );

		expect( await client.wasMerged( { slug: 'owner/repo', head: 'ai-tasks/t/x/stable' } ) ).toBe( true );
		expect( fetchMock.mock.calls[ 0 ]![ 0 ] ).toBe(
			'https://api.github.com/repos/owner/repo/pulls?state=closed&head=owner%3Aai-tasks%2Ft%2Fx%2Fstable&per_page=100'
		);

		fetchMock.mockResolvedValueOnce( jsonResponse( [ { merged_at: null } ] ) );

		expect( await client.wasMerged( { slug: 'owner/repo', head: 'ai-tasks/t/x/stable' } ) ).toBe( false );
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

	it( 'updatePullRequest() patches the base branch', async () => {
		await client.updatePullRequest( { slug: 'owner/repo', number: 3, base: 'stable' } );

		expect( JSON.parse( fetchMock.mock.calls[ 0 ]![ 1 ].body ) ).toEqual( { base: 'stable' } );
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
