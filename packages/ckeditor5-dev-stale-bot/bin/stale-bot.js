#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const ora = require( 'ora' );
const chalk = require( 'chalk' );
const fs = require( 'fs-extra' );
const minimist = require( 'minimist' );
const GitHubRepository = require( '../lib/githubrepository' );
const prepareOptions = require( '../lib/utils/prepareoptions' );

main().catch( error => {
	console.error( '\n🔥 Unable to process stale issues and pull requests.\n', error );

	process.exit( 1 );
} );

async function main() {
	if ( !process.env.CKE5_GITHUB_TOKEN ) {
		throw new Error( 'Missing environment variable: CKE5_GITHUB_TOKEN' );
	}

	const { configPath, dryRun } = parseArguments( process.argv.slice( 2 ) );

	if ( !configPath || !await fs.exists( configPath ) ) {
		throw new Error( 'Missing or invalid CLI argument: --config-path' );
	}

	const config = await fs.readJson( configPath );

	if ( !config.REPOSITORY_SLUG ) {
		throw new Error( 'Missing configuration option: REPOSITORY_SLUG' );
	}

	printWelcomeMessage( dryRun );

	const githubRepository = new GitHubRepository( process.env.CKE5_GITHUB_TOKEN );

	const viewerLogin = await githubRepository.getViewerLogin();

	const spinner = ora( '🔎 Searching for issues to stale...' ).start();

	const issueOptions = prepareOptions( viewerLogin, 'issue', config );
	const staleIssues = await githubRepository.searchIssuesToStale( issueOptions, onProgress( spinner ) );

	spinner.text = '🔎 Searching for pull requests to stale...';

	const pullRequestOptions = prepareOptions( viewerLogin, 'pr', config );
	const stalePullRequests = await githubRepository.searchIssuesToStale( pullRequestOptions, onProgress( spinner ) );

	spinner.stop();

	if ( !staleIssues.length && !stalePullRequests.length ) {
		console.log( chalk.green.bold( '✨ No issues or pull requests found that should be marked as stale.' ) );

		return;
	}

	console.log( chalk.blue.bold( '🔖 The following issues or pull requests should be marked as stale:\n' ) );

	[ ...staleIssues, ...stalePullRequests ].forEach( entry => console.log( entry.slug ) );
}

function parseArguments( args ) {
	const config = {
		boolean: [
			'dry-run'
		],

		string: [
			'config-path'
		],

		default: {
			'dry-run': false,
			'config-path': ''
		}
	};

	const options = minimist( args, config );

	return {
		dryRun: options[ 'dry-run' ],
		configPath: options[ 'config-path' ]
	};
}

function onProgress( spinner ) {
	const title = spinner.text;

	return ( { done, total } ) => {
		const progress = total ? Math.round( ( done / total ) * 100 ) : 0;

		spinner.text = `${ title } ${ chalk.bold( `${ progress }%` ) }`;
	};
}

function printWelcomeMessage( dryRun ) {
	const message = [
		'',
		`🦾 ${ chalk.bold( 'STALE BOT' ) }`,
		'',
		dryRun ?
			chalk.italic( `The --dry-run flag is ${ chalk.green.bold( 'ON' ) }, so bot does not perform any changes.` ) :
			chalk.italic( `The --dry-run flag is ${ chalk.red.bold( 'OFF' ) }, so bot makes use of your real, live, production data.` ),
		''
	];

	console.log( message.join( '\n' ) );
}
