/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const API_URL = 'https://api.github.com';

// The version of the GitHub REST API the requests are written against.
const API_VERSION = '2026-03-10';

// How long one request may take, in milliseconds.
const REQUEST_TIMEOUT = 30_000;

export type PullRequest = {
	number: number;
	html_url: string;
};

export type GitHubClient = {

	/**
	 * Returns the open pull request from the branch, or `null`. The base branch is not a criterion: a human may change
	 * it in the pull request.
	 */
	findOpenPullRequest( options: { slug: string; head: string } ): Promise<PullRequest | null>;
	createPullRequest( options: { slug: string; head: string; base: string; title: string; body: string } ): Promise<PullRequest>;
	updatePullRequest( options: { slug: string; number: number; body: string } ): Promise<PullRequest>;
	createComment( options: { slug: string; number: number; body: string } ): Promise<unknown>;
};

/**
 * Creates a minimal client of the GitHub REST API with the calls that report pull requests need.
 */
export function createGitHubClient( token: string ): GitHubClient {
	async function request<T>( method: string, path: string, body?: unknown ): Promise<T> {
		const response = await fetch( `${ API_URL }${ path }`, {
			method,
			signal: AbortSignal.timeout( REQUEST_TIMEOUT ),
			headers: {
				'Accept': 'application/vnd.github+json',
				'Authorization': `Bearer ${ token }`,
				'X-GitHub-Api-Version': API_VERSION,
				...( body ? { 'Content-Type': 'application/json' } : {} )
			},
			body: body ? JSON.stringify( body ) : undefined
		} );

		if ( !response.ok ) {
			const text = await response.text();

			throw new Error( `GitHub API request "${ method } ${ path }" failed with status ${ response.status }: ${ text }` );
		}

		return response.json() as Promise<T>;
	}

	return {
		async findOpenPullRequest( { slug, head } ) {
			const [ owner ] = slug.split( '/' );
			const query = new URLSearchParams( { state: 'open', head: `${ owner }:${ head }` } );
			const pullRequests = await request<Array<PullRequest>>( 'GET', `/repos/${ slug }/pulls?${ query }` );

			return pullRequests[ 0 ] ?? null;
		},

		createPullRequest( { slug, head, base, title, body } ) {
			return request( 'POST', `/repos/${ slug }/pulls`, { head, base, title, body } );
		},

		updatePullRequest( { slug, number, body } ) {
			return request( 'PATCH', `/repos/${ slug }/pulls/${ number }`, { body } );
		},

		createComment( { slug, number, body } ) {
			return request( 'POST', `/repos/${ slug }/issues/${ number }/comments`, { body } );
		}
	};
}
