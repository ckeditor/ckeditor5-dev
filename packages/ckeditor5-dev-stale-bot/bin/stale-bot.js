#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs/promises';
import { styleText } from 'node:util';
import createSpinner from './utils/createspinner.js';
import parseArguments from './utils/parsearguments.js';
import validateConfig from './utils/validateconfig.js';
import parseConfig from './utils/parseconfig.js';
import GitHubRepository from '../lib/githubrepository.js';

main().catch( error => {
	console.error( '\n🔥 Unable to process stale issues and pull requests.\n', error );

	process.exit( 1 );
} );

/**
 * Launches the stale bot that searches the issues and pull requests to stale, unstale or close.
 * It also may check if pending issues should be staled or have the pending labels removed.
 *
 * @returns {Promise}
 */
async function main() {
	const { configPath, dryRun } = parseArguments( process.argv.slice( 2 ) );

	try {
		await fs.readFile( configPath );
	} catch {
		throw new Error( 'Missing or invalid CLI argument: --config-path' );
	}

	const { default: config } = await import( configPath );

	validateConfig( config );

	printWelcomeMessage( dryRun );

	const githubRepository = new GitHubRepository( config.GITHUB_TOKEN );
	const viewerLogin = await githubRepository.getViewerLogin();
	const options = parseConfig( viewerLogin, config );

	const spinner = createSpinner();
	spinner.instance.start();

	const searchResult = await search( githubRepository, options, spinner );
	const {
		issuesOrPullRequestsToStale,
		issuesOrPullRequestsToClose,
		issuesOrPullRequestsToUnstale,
		pendingIssuesToStale,
		pendingIssuesToUnlabel
	} = searchResult;

	if ( !dryRun ) {
		const staleLabels = await githubRepository.getLabels( options.repositorySlug, options.staleLabels );
		const closeIssueLabels = await githubRepository.getLabels( options.repositorySlug, options.closeIssueLabels );
		const closePullRequestLabels = await githubRepository.getLabels( options.repositorySlug, options.closePullRequestLabels );
		const pendingIssueLabels = await githubRepository.getLabels( options.repositorySlug, options.pendingIssueLabels );

		if ( issuesOrPullRequestsToStale.length || pendingIssuesToStale.length ) {
			const actions = {
				title: 'Staling issues and pull requests...',
				labelsToAdd() {
					return staleLabels;
				},
				commentToAdd( entry ) {
					const isPendingIssueToStale = pendingIssuesToStale.includes( entry );

					if ( isPendingIssueToStale ) {
						return options.stalePendingIssueMessage;
					}

					return entry.type === 'Issue' ? options.staleIssueMessage : options.stalePullRequestMessage;
				}
			};

			const entries = [ ...issuesOrPullRequestsToStale, ...pendingIssuesToStale ];

			await handleActions( githubRepository, entries, actions, spinner );
		}

		if ( issuesOrPullRequestsToUnstale.length ) {
			const actions = {
				title: 'Unstaling issues and pull requests...',
				labelsToRemove: staleLabels
			};

			await handleActions( githubRepository, issuesOrPullRequestsToUnstale, actions, spinner );
		}

		if ( issuesOrPullRequestsToClose.length ) {
			const actions = {
				title: 'Closing issues and pull requests...',
				labelsToRemove: staleLabels,
				labelsToAdd( entry ) {
					return entry.type === 'Issue' ? closeIssueLabels : closePullRequestLabels;
				},
				commentToAdd( entry ) {
					return entry.type === 'Issue' ? options.closeIssueMessage : options.closePullRequestMessage;
				},
				close: true
			};

			await handleActions( githubRepository, issuesOrPullRequestsToClose, actions, spinner );
		}

		if ( pendingIssuesToUnlabel.length ) {
			const actions = {
				title: 'Unlabeling pending issues...',
				labelsToRemove: pendingIssueLabels
			};

			await handleActions( githubRepository, pendingIssuesToUnlabel, actions, spinner );
		}
	}

	spinner.instance.stop();

	printStatus( dryRun, searchResult, options );
}

/**
 * Searches for new issues or pull requests to stale and already staled ones that should be unstaled or closed.
 * It also searches for pending issues that should be staled or unlabeled.
 *
 * @param {GitHubRepository} githubRepository GitHubRepository instance.
 * @param {Options} options Configuration options.
 * @param {Spinner} spinner Spinner.
 * @returns {Promise.<SearchResult>}
 */
async function search( githubRepository, options, spinner ) {
	spinner.printStatus( 'Searching for new issues to stale...' );

	const issuesToStale = await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', options, spinner.onProgress() );

	spinner.printStatus( 'Searching for new pull requests to stale...' );

	const pullRequestsToStale = await githubRepository.searchIssuesOrPullRequestsToStale( 'PullRequest', options, spinner.onProgress() );

	spinner.printStatus( 'Searching for current stale issues and pull requests...' );

	const {
		issuesOrPullRequestsToClose,
		issuesOrPullRequestsToUnstale
	} = await githubRepository.searchStaleIssuesOrPullRequests( options, spinner.onProgress() );

	let pendingIssuesToStale = [];
	let pendingIssuesToUnlabel = [];

	if ( options.shouldProcessPendingIssues ) {
		spinner.printStatus( 'Searching for pending issues...' );

		const pendingIssues = await githubRepository.searchPendingIssues( options, spinner.onProgress() );
		pendingIssuesToStale = pendingIssues.pendingIssuesToStale;
		pendingIssuesToUnlabel = pendingIssues.pendingIssuesToUnlabel;
	}

	return {
		issuesOrPullRequestsToStale: [ ...issuesToStale, ...pullRequestsToStale ],
		issuesOrPullRequestsToUnstale,
		issuesOrPullRequestsToClose,
		pendingIssuesToStale,
		pendingIssuesToUnlabel
	};
}

/**
 * Executes provided actions on each issue or pull request.
 *
 * @param {GitHubRepository} githubRepository GitHubRepository instance.
 * @param {Array.<IssueOrPullRequestResult>} entries An array of issues or pull requests to process.
 * @param {Actions} actions Actions to execute on each issue or pull request.
 * @param {Spinner} spinner Spinner.
 * @returns {Promise}
 */
async function handleActions( githubRepository, entries, actions, spinner ) {
	spinner.printStatus( actions.title );

	const onProgress = spinner.onProgress();

	for ( const entry of entries ) {
		onProgress( {
			done: entries.indexOf( entry ),
			total: entries.length
		} );

		if ( actions.commentToAdd ) {
			await githubRepository.addComment( entry.id, actions.commentToAdd( entry ) );
		}

		if ( actions.labelsToAdd ) {
			await githubRepository.addLabels( entry.id, actions.labelsToAdd( entry ) );
		}

		if ( actions.labelsToRemove ) {
			await githubRepository.removeLabels( entry.id, actions.labelsToRemove );
		}

		if ( actions.close ) {
			await githubRepository.closeIssueOrPullRequest( entry.type, entry.id );
		}
	}
}

/**
 * Prints in the console a welcome message.
 *
 * @param {boolean} dryRun Indicates if dry run mode is enabled.
 */
function printWelcomeMessage( dryRun ) {
	const message = [
		'',
		dryRun ?
			styleText(
				'italic',
				`The --dry-run flag is ${ styleText( [ 'green', 'bold' ], 'ON' ) }, so bot does not perform any changes.`
			) :
			styleText(
				'italic',
				`The --dry-run flag is ${ styleText( [ 'red', 'bold' ], 'OFF' ) }, so bot makes use of real, live, production data.`
			),
		''
	];

	console.log( message.join( '\n' ) );
}

/**
 * Prints in the console status messages about actions required to be executed on found issues and pull requests.
 *
 * @param {boolean} dryRun Indicates if dry run mode is enabled.
 * @param {SearchResult} searchResult Found issues and pull requests that require an action.
 * @param {Options} options Configuration options.
 */
function printStatus( dryRun, searchResult, options ) {
	const {
		issuesOrPullRequestsToStale,
		issuesOrPullRequestsToClose,
		issuesOrPullRequestsToUnstale,
		pendingIssuesToStale,
		pendingIssuesToUnlabel
	} = searchResult;

	if ( !issuesOrPullRequestsToStale.length && !pendingIssuesToStale.length ) {
		console.log( styleText( [ 'green', 'bold' ], '💡 No new issues or pull requests found that should be staled.\n' ) );
	} else {
		const statusMessage = dryRun ?
			'🔖 The following issues or pull requests should be staled:\n' :
			'🔖 The following issues or pull requests were staled:\n';

		printStatusSection( statusMessage, [ ...issuesOrPullRequestsToStale, ...pendingIssuesToStale ] );
	}

	if ( !issuesOrPullRequestsToUnstale.length ) {
		console.log( styleText( [ 'green', 'bold' ], '💡 No stale issues or pull requests can be unstaled now.\n' ) );
	} else {
		const statusMessage = dryRun ?
			'🔖 The following issues or pull requests should be unstaled:\n' :
			'🔖 The following issues or pull requests were unstaled:\n';

		printStatusSection( statusMessage, issuesOrPullRequestsToUnstale );
	}

	if ( !issuesOrPullRequestsToClose.length ) {
		console.log( styleText( [ 'green', 'bold' ], '💡 No stale issues or pull requests can be closed now.\n' ) );
	} else {
		const statusMessage = dryRun ?
			'🔖 The following issues or pull requests should be closed:\n' :
			'🔖 The following issues or pull requests were closed:\n';

		printStatusSection( statusMessage, issuesOrPullRequestsToClose );
	}

	if ( options.shouldProcessPendingIssues ) {
		if ( !pendingIssuesToUnlabel.length ) {
			console.log( styleText( [ 'green', 'bold' ], '💡 No pending issues can be unlabeled now.\n' ) );
		} else {
			const statusMessage = dryRun ?
				'🔖 The following pending issues should be unlabeled:\n' :
				'🔖 The following pending issues were unlabeled:\n';

			printStatusSection( statusMessage, pendingIssuesToUnlabel );
		}
	}
}

/**
 * Prints in the console issues and pull requests from a single section.
 *
 * @param {string} statusMessage Section header.
 * @param {Array.<IssueOrPullRequestResult>} entries Found issues and pull requests.
 */
function printStatusSection( statusMessage, entries ) {
	console.log( styleText( [ 'blue', 'bold' ], statusMessage ) );

	entries.forEach( entry => console.log( `${ entry.url } - ${ entry.title }` ) );

	console.log();
}

/**
 * @typedef {object} SearchResult
 * @property {Array.<IssueOrPullRequestResult>} issuesOrPullRequestsToClose
 * @property {Array.<IssueOrPullRequestResult>} issuesOrPullRequestsToStale
 * @property {Array.<IssueOrPullRequestResult>} issuesOrPullRequestsToUnstale
 * @property {Array.<IssueOrPullRequestResult>} pendingIssuesToStale
 * @property {Array.<IssueOrPullRequestResult>} pendingIssuesToUnlabel
 */

/**
 * @typedef {object} Actions
 * @property {HandleActionsCommentToAdd} [commentToAdd]
 * @property {HandleActionsLabelsToAdd} [labelsToAdd]
 * @property {Array.<string>} [labelsToRemove]
 * @property {boolean} [close]
 */

/**
 * @callback HandleActionsLabelsToAdd
 * @param {IssueOrPullRequestResult} entry
 * @returns {Array.<string>}
 */

/**
 * @callback HandleActionsCommentToAdd
 * @param {IssueOrPullRequestResult} entry
 * @returns {string}
 */
