#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Listr } from 'listr2';
import { ListrInquirerPromptAdapter } from '@listr2/prompt-adapter-inquirer';
import { confirm } from '@inquirer/prompts';
import { Octokit } from '@octokit/rest';
import * as releaseTools from '@ckeditor/ckeditor5-dev-release-tools';
import parseArguments from './utils/parsearguments.js';
import getListrOptions from './utils/getlistroptions.js';
import { RELEASE_DIRECTORY } from './utils/constants.js';

const cliArguments = parseArguments( process.argv.slice( 2 ) );
const latestVersion = releaseTools.getLastFromChangelog();
const versionChangelog = releaseTools.getChangesForVersion( latestVersion );

const githubToken = await getGitHubToken();

if ( !cliArguments.npmTag ) {
	cliArguments.npmTag = releaseTools.getNpmTagFromVersion( latestVersion );
}

const tasks = new Listr( [
	{
		title: 'Publishing packages.',
		task: async ( _, task ) => {
			return releaseTools.publishPackages( {
				packagesDirectory: RELEASE_DIRECTORY,
				npmOwner: 'ckeditor',
				npmTag: cliArguments.npmTag,
				listrTask: task,
				confirmationCallback: () => {
					if ( cliArguments.ci ) {
						return true;
					}

					return task.prompt( ListrInquirerPromptAdapter )
						.run( confirm, { message: 'Do you want to continue?' } );
				}
			} );
		}
	},
	{
		title: 'Pushing changes.',
		task: () => {
			return releaseTools.push( {
				releaseBranch: cliArguments.branch,
				version: latestVersion
			} );
		}
	},
	{
		title: 'Creating the release page.',
		task: async ( _, task ) => {
			const releaseUrl = await releaseTools.createGithubRelease( {
				token: githubToken,
				version: latestVersion,
				description: versionChangelog
			} );

			task.output = `Release page: ${ releaseUrl }`;
		},
		options: {
			persistentOutput: true
		}
	},
	{
		title: 'Mark v43 as "latest" (GitHub)',
		task: async () => {
			const github = new Octokit( {
				version: '3.0.0',
				auth: `token ${ githubToken }`
			} );

			return github.request( 'PATCH /repos/{owner}/{repo}/releases/{release_id}', {
				owner: 'ckeditor',
				repo: 'ckeditor5-dev',
				release_id: 227938481, // v43.1.0
				make_latest: true
			} );
		}
	}
], getListrOptions( cliArguments ) );

tasks.run()
	.catch( err => {
		process.exitCode = 1;

		console.error( err );
	} );

/**
 * @returns {Promise.<string>}
 */
async function getGitHubToken() {
	if ( process.env.CKE5_RELEASE_TOKEN ) {
		return process.env.CKE5_RELEASE_TOKEN;
	}

	return releaseTools.provideToken();
}
