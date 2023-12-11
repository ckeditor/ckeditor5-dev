#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const chalk = require( 'chalk' );
const createSpinner = require( './utils/createspinner' );
const parseArguments = require( './utils/parsearguments' );
const validateConfig = require( './utils/validateconfig' );
const parseConfig = require( './utils/parseconfig' );
const GitHubRepository = require( '../lib/githubrepository' );

main().catch( error => {
	console.error( '\n🔥 Unable to process stale issues and pull requests.\n', error );

	process.exit( 1 );
} );

/**
 * Launches the stale bot that searches the issues and pull requests to stale, unstale or close.
 *
 * @returns {Promise}
 */
async function main() {
	const { configPath, dryRun } = parseArguments( process.argv.slice( 2 ) );

	if ( !configPath || !await fs.exists( configPath ) ) {
		throw new Error( 'Missing or invalid CLI argument: --config-path' );
	}

	const config = require( configPath );

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
		issuesOrPullRequestsToUnstale
	} = searchResult;

	if ( !dryRun ) {
		const staleLabels = await githubRepository.getLabels( options.repositorySlug, options.staleLabels );

		if ( issuesOrPullRequestsToStale.length ) {
			const actions = {
				title: 'Staling issues and pull requests...',
				labelsToAdd: staleLabels,
				commentToAdd( entry ) {
					return entry.type === 'Issue' ? options.staleIssueMessage : options.stalePullRequestMessage;
				}
			};

			await handleActions( githubRepository, issuesOrPullRequestsToStale, actions, spinner );
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
				commentToAdd( entry ) {
					return entry.type === 'Issue' ? options.closeIssueMessage : options.closePullRequestMessage;
				},
				close: true
			};

			await handleActions( githubRepository, issuesOrPullRequestsToClose, actions, spinner );
		}
	}

	spinner.instance.stop();

	printStatus( dryRun, searchResult );
}

/**
 * Searches for new issues or pull requests to stale and already staled ones that should be unstaled or closed.
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

	return {
		issuesOrPullRequestsToStale: [ ...issuesToStale, ...pullRequestsToStale ],
		issuesOrPullRequestsToUnstale,
		issuesOrPullRequestsToClose
	};
}

/**
 * Executes provided actions on each issue or pull request.
 *
 * @param {GitHubRepository} githubRepository GitHubRepository instance.
 * @param {Array.<IssueOrPullRequest>} entries An array of issues or pull requests to process.
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
			await githubRepository.addLabels( entry.id, actions.labelsToAdd );
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
 * @param {Boolean} dryRun Indicates if dry run mode is enabled.
 */
function printWelcomeMessage( dryRun ) {
	const message = [
		'',
		dryRun ?
			chalk.italic( `The --dry-run flag is ${ chalk.green.bold( 'ON' ) }, so bot does not perform any changes.` ) :
			chalk.italic( `The --dry-run flag is ${ chalk.red.bold( 'OFF' ) }, so bot makes use of real, live, production data.` ),
		''
	];

	console.log( message.join( '\n' ) );
}

/**
 * Prints in the console status messages about actions required to be executed on found issues and pull requests.
 *
 * @param {Boolean} dryRun Indicates if dry run mode is enabled.
 * @param {SearchResult} searchResult Found issues and pull requests that require an action.
 */
function printStatus( dryRun, searchResult ) {
	const {
		issuesOrPullRequestsToStale,
		issuesOrPullRequestsToClose,
		issuesOrPullRequestsToUnstale
	} = searchResult;

	if ( !issuesOrPullRequestsToStale.length ) {
		console.log( chalk.green.bold( '\n💡 No new issues or pull requests found that should be staled.' ) );
	} else {
		const statusMessage = dryRun ?
			'\n🔖 The following issues or pull requests should be staled:\n' :
			'\n🔖 The following issues or pull requests were staled:\n';

		console.log( chalk.blue.bold( statusMessage ) );

		issuesOrPullRequestsToStale.forEach( entry => console.log( `${ entry.url } - ${ entry.title }` ) );
	}

	if ( !issuesOrPullRequestsToUnstale.length ) {
		console.log( chalk.green.bold( '\n💡 No stale issues or pull requests can be unstaled now.' ) );
	} else {
		const statusMessage = dryRun ?
			'\n🔖 The following issues or pull requests should be unstaled:\n' :
			'\n🔖 The following issues or pull requests were unstaled:\n';

		console.log( chalk.blue.bold( statusMessage ) );

		issuesOrPullRequestsToUnstale.forEach( entry => console.log( entry.url ) );
	}

	if ( !issuesOrPullRequestsToClose.length ) {
		console.log( chalk.green.bold( '\n💡 No stale issues or pull requests can be closed now.' ) );
	} else {
		const statusMessage = dryRun ?
			'\n🔖 The following issues or pull requests should be closed:\n' :
			'\n🔖 The following issues or pull requests were closed:\n';

		console.log( chalk.blue.bold( statusMessage ) );

		issuesOrPullRequestsToClose.forEach( entry => console.log( entry.url ) );
	}
}

/**
 * @typedef {Object} SearchResult
 * @property {Array.<IssueOrPullRequest>} issuesOrPullRequestsToClose
 * @property {Array.<IssueOrPullRequest>} issuesOrPullRequestsToStale
 * @property {Array.<IssueOrPullRequest>} issuesOrPullRequestsToUnstale
 */

/**
 * @typedef {Object} Actions
 * @property {Function} [commentToAdd]
 * @property {Array.<String>} [labelsToAdd]
 * @property {Array.<String>} [labelsToRemove]
 * @property {Boolean} [close]
 */
