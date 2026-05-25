#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import slackNotify from 'slack-notify';
import formatMessage from '../lib/format-message.js';

// This script assumes that it is being executed in a GitHub Actions runner.
// The step using it should be conditional on the workflow having failed
// (for example via `if: failure()` or a dedicated job depending on the failed one),
// since the script itself does not check whether the workflow failed before sending
// the notification.
//
// Described environment variables starting with "CKE5" must be added by the integrator.

const {
	/**
	 * Required. Token to a GitHub account with the `repo` scope. It is required for obtaining
	 * the author of the commit that triggered the failed workflow run. The repository can be
	 * private, so the public, unauthenticated API cannot be used.
	 */
	CKE5_GITHUB_TOKEN,

	/**
	 * Required. Webhook URL of the Slack channel where the notification should be sent.
	 */
	CKE5_SLACK_WEBHOOK_URL,

	// Variables that are available by default in the GitHub Actions environment.
	// See: https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables.
	GITHUB_REPOSITORY,
	GITHUB_REF_NAME,
	GITHUB_SHA,
	GITHUB_RUN_ID,
	GITHUB_RUN_ATTEMPT,
	GITHUB_WORKFLOW,
	GITHUB_SERVER_URL,
	GITHUB_API_URL
} = process.env;

const { values: cliArguments } = parseArgs( {
	options: {
		/**
		 * Optional. If both are defined, the script will use the URL as the commit URL.
		 * Otherwise, the URL will be constructed using the current repository data.
		 */
		'trigger-repository-slug': {
			type: 'string',
			default: process.env.CKE5_TRIGGER_REPOSITORY_SLUG
		},
		'trigger-commit-hash': {
			type: 'string',
			default: process.env.CKE5_TRIGGER_COMMIT_HASH
		},

		/**
		 * Optional. If set to "true" or "1", commit author will be hidden.
		 * See: https://github.com/ckeditor/ckeditor5/issues/9252.
		 */
		'hide-author': {
			type: 'string',
			default: process.env.CKE5_SLACK_NOTIFY_HIDE_AUTHOR
		}
	}
} );

notifyGitHubActionsStatus().catch( err => {
	console.error( err );
	process.exit( 1 );
} );

async function notifyGitHubActionsStatus() {
	assertRequiredEnvironmentVariables();

	const serverUrl = ( GITHUB_SERVER_URL || 'https://github.com' ).replace( /\/$/, '' );
	const apiUrl = ( GITHUB_API_URL || 'https://api.github.com' ).replace( /\/$/, '' );
	const [ repositoryOwner, repositoryName ] = GITHUB_REPOSITORY.split( '/' );
	const runAttempt = GITHUB_RUN_ATTEMPT ? Number( GITHUB_RUN_ATTEMPT ) : 1;

	const runData = await getWorkflowRunData( { apiUrl, repositoryOwner, repositoryName } );
	const buildUrl = [ serverUrl, GITHUB_REPOSITORY, 'actions', 'runs', GITHUB_RUN_ID, 'attempts', runAttempt ].join( '/' );
	const startedAtIso = runData.run_started_at || runData.created_at;

	const message = await formatMessage( {
		slackMessageUsername: 'GitHub Actions',
		iconUrl: 'https://avatars.githubusercontent.com/in/15368?s=80&v=4',
		repositoryOwner,
		repositoryName,
		branch: GITHUB_REF_NAME,
		buildTitle: GITHUB_WORKFLOW || 'Workflow run',
		buildUrl,
		buildId: `#${ GITHUB_RUN_ID }${ runAttempt > 1 ? ` (attempt ${ runAttempt })` : '' }`,
		githubToken: CKE5_GITHUB_TOKEN,
		triggeringCommitUrl: getTriggeringCommitUrl( serverUrl ),
		apiUrl,
		startTime: startedAtIso ? Math.ceil( new Date( startedAtIso ).getTime() / 1000 ) : null,
		endTime: Math.ceil( Date.now() / 1000 ),
		shouldHideAuthor: isTrueLike( cliArguments[ 'hide-author' ] )
	} );

	return slackNotify( CKE5_SLACK_WEBHOOK_URL )
		.send( message )
		.catch( err => console.log( 'API error occurred:', err ) );
}

function assertRequiredEnvironmentVariables() {
	const required = {
		CKE5_GITHUB_TOKEN,
		CKE5_SLACK_WEBHOOK_URL,
		GITHUB_REPOSITORY,
		GITHUB_REF_NAME,
		GITHUB_SHA,
		GITHUB_RUN_ID
	};

	for ( const [ name, value ] of Object.entries( required ) ) {
		if ( !value ) {
			throw new Error( `Missing environment variable: ${ name }` );
		}
	}
}

async function getWorkflowRunData( { apiUrl, repositoryOwner, repositoryName } ) {
	const fetchUrl = [ apiUrl, 'repos', repositoryOwner, repositoryName, 'actions', 'runs', GITHUB_RUN_ID ].join( '/' );
	const fetchOptions = {
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github+json',
			'Authorization': `Bearer ${ CKE5_GITHUB_TOKEN }`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	};

	const response = await fetch( fetchUrl, fetchOptions );

	if ( !response.ok ) {
		throw new Error( `Failed to fetch workflow run ${ GITHUB_RUN_ID }: HTTP ${ response.status }.` );
	}

	return response.json();
}

function getTriggeringCommitUrl( serverUrl ) {
	const cliRepoSlug = cliArguments[ 'trigger-repository-slug' ];
	const cliCommitHash = cliArguments[ 'trigger-commit-hash' ];

	const repoSlug = cliRepoSlug && cliCommitHash ? cliRepoSlug.trim() : GITHUB_REPOSITORY;
	const hash = cliRepoSlug && cliCommitHash ? cliCommitHash.trim() : GITHUB_SHA;

	return [ serverUrl, repoSlug, 'commit', hash ].join( '/' );
}

function isTrueLike( value ) {
	return value === true || value === 1 || value === '1' || value === 'true';
}
