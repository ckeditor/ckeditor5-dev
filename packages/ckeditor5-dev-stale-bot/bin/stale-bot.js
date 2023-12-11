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
const prepareSearchOptions = require( './utils/preparesearchoptions' );
const GitHubRepository = require( '../lib/githubrepository' );

main().catch( error => {
	console.error( '\n🔥 Unable to process stale issues and pull requests.\n', error );

	process.exit( 1 );
} );

async function main() {
	const { configPath, dryRun } = parseArguments( process.argv.slice( 2 ) );

	if ( !configPath || !await fs.exists( configPath ) ) {
		throw new Error( 'Missing or invalid CLI argument: --config-path' );
	}

	const config = require( configPath );

	validateConfig( config );
	printWelcomeMessage( dryRun );

	const githubRepository = new GitHubRepository( config.CKE5_GITHUB_TOKEN );

	const spinner = createSpinner();

	const { issuesToStale, pullRequestsToStale } = await searchToStale( githubRepository, config, spinner );

	if ( !issuesToStale.length && !pullRequestsToStale.length ) {
		spinner.instance.stop();

		console.log( chalk.green.bold( '✨ No issues or pull requests found that should be marked as stale.' ) );

		return;
	}

	const entries = [ ...issuesToStale, ...pullRequestsToStale ];

	if ( !dryRun ) {
		await markAsStale( githubRepository, entries, config, spinner );
	}

	spinner.instance.stop();

	const statusMessage = dryRun ?
		'🔖 The following issues or pull requests should be marked as stale:\n' :
		'🔖 The following issues or pull requests were marked as stale:\n';

	console.log( chalk.blue.bold( statusMessage ) );

	entries.forEach( entry => console.log( `${ entry.url } - ${ entry.title }` ) );
}

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

async function searchToStale( githubRepository, config, spinner ) {
	const viewerLogin = await githubRepository.getViewerLogin();

	spinner.printStatus( '🔎 Searching for issues to stale...' );

	const issuesToStaleOptions = prepareSearchOptions( viewerLogin, 'issue', config );
	const issuesToStale = await githubRepository.searchIssuesToStale( issuesToStaleOptions, spinner.onProgressFactory() );

	spinner.printStatus( '🔎 Searching for pull requests to stale...' );

	const pullRequestsToStaleOptions = prepareSearchOptions( viewerLogin, 'pr', config );
	const pullRequestsToStale = await githubRepository.searchIssuesToStale( pullRequestsToStaleOptions, spinner.onProgressFactory() );

	return {
		issuesToStale,
		pullRequestsToStale
	};
}

async function markAsStale( githubRepository, entries, config, spinner ) {
	spinner.printStatus( '🔎 Fetching stale labels...' );

	const staleLabels = await githubRepository.getLabels( config.REPOSITORY_SLUG, config.STALE_LABELS );

	spinner.printStatus( '🔎 Marking found issues and pull requests as stale...' );

	const onProgress = spinner.onProgressFactory();

	for ( const entry of entries ) {
		onProgress( {
			done: entries.indexOf( entry ),
			total: entries.length
		} );

		const staleMessage = entry.type === 'Issue' ? config.STALE_ISSUE_MESSAGE : config.STALE_PR_MESSAGE;

		await githubRepository.addLabels( entry.id, staleLabels.map( label => label.id ) );
		await githubRepository.addComment( entry.id, staleMessage );
	}
}
