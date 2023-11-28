#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

	const { configPath } = parseArguments( process.argv.slice( 2 ) );

	if ( !configPath || !await fs.exists( configPath ) ) {
		throw new Error( 'Missing or invalid CLI argument: --config-path' );
	}

	const config = await fs.readJson( configPath );

	if ( !config.REPOSITORY_SLUG ) {
		throw new Error( 'Missing configuration option: REPOSITORY_SLUG' );
	}

	console.log( `\n🔎 Searching for stale issues and pull requests in ${ chalk.bold( config.REPOSITORY_SLUG ) }...` );

	const githubRepository = new GitHubRepository( process.env.CKE5_GITHUB_TOKEN );

	const viewerLogin = await githubRepository.getViewerLogin();

	const issueOptions = prepareOptions( viewerLogin, 'issue', config );
	const staleIssues = await githubRepository.searchStaleIssues( issueOptions );

	const pullRequestOptions = prepareOptions( viewerLogin, 'pr', config );
	const stalePullRequests = await githubRepository.searchStaleIssues( pullRequestOptions );

	if ( !staleIssues.length && !stalePullRequests.length ) {
		console.log( chalk.green.bold( '\n✨ No stale issues or pull requests have been found.' ) );

		return;
	}

	console.log( chalk.blue.bold( '\n🔖 The following stale issues or pull requests have been found:\n' ) );

	[ ...staleIssues, ...stalePullRequests ].forEach( entry => console.log( entry.slug ) );
}

/**
 * Parses CLI arguments.
 *
 * @param {Array.<String>} args CLI arguments.
 * @returns {Object} result
 * @returns {String} result.configPath Path to stale bot configuration.
 * @returns {Boolean} [result.dryRun=false] If set, nothing will be changed in real, production data on GitHub.
 */
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
