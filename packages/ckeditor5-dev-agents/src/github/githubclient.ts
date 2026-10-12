/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Octokit } from '@octokit/rest';

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
	const octokit = new Octokit( { auth: token } );

	octokit.hook.before( 'request', options => {
		options.headers[ 'x-github-api-version' ] = API_VERSION;
		options.request = { ...options.request, signal: AbortSignal.timeout( REQUEST_TIMEOUT ) };
	} );

	// The message of Octokit does not say which request failed. Octokit adds the request to the error of a request that
	// failed, including one that timed out, but not to an aborted one.
	octokit.hook.error( 'request', error => {
		const { status, request } = error as Partial<{ status: number; request: { method: string; url: string } }>;

		if ( !status || !request ) {
			throw error;
		}

		const message = `GitHub API request "${ request.method } ${ request.url }" failed with status ${ status }: ${ error.message }`;

		throw new Error( message, { cause: error } );
	} );

	return {
		async findOpenPullRequest( { slug, head } ) {
			const [ owner, repo ] = splitSlug( slug );
			const { data } = await octokit.pulls.list( { owner, repo, state: 'open', head: `${ owner }:${ head }` } );

			return data[ 0 ] ?? null;
		},

		async createPullRequest( { slug, head, base, title, body } ) {
			const [ owner, repo ] = splitSlug( slug );

			return ( await octokit.pulls.create( { owner, repo, head, base, title, body } ) ).data;
		},

		async updatePullRequest( { slug, number, body } ) {
			const [ owner, repo ] = splitSlug( slug );

			return ( await octokit.pulls.update( { owner, repo, pull_number: number, body } ) ).data;
		},

		async createComment( { slug, number, body } ) {
			const [ owner, repo ] = splitSlug( slug );

			return ( await octokit.issues.createComment( { owner, repo, issue_number: number, body } ) ).data;
		}
	};
}

function splitSlug( slug: string ): [ owner: string, repo: string ] {
	const [ owner, repo ] = slug.split( '/' );

	return [ owner!, repo! ];
}
