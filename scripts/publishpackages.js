#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const { Listr } = require( 'listr2' );
const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );
const { provideToken } = require( '@ckeditor/ckeditor5-dev-release-tools/lib/utils/cli' );
const parseArguments = require( './utils/parsearguments' );
const getListrOptions = require( './utils/getlistroptions' );
const { RELEASE_DIRECTORY } = require( './utils/constants' );

const cliArguments = parseArguments( process.argv.slice( 2 ) );
const latestVersion = releaseTools.getLastFromChangelog();
const versionChangelog = releaseTools.getChangesForVersion( latestVersion );

let githubToken;

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

					return task.prompt( { type: 'Confirm', message: 'Do you want to continue?' } );
				}
			} );
		},
		retry: 3
	},
	{
		title: 'Checking if packages that returned E409 error code were uploaded correctly.',
		task: async ( _, task ) => {
			return releaseTools.verifyPackagesPublishedCorrectly( {
				packagesDirectory: RELEASE_DIRECTORY,
				version: latestVersion,
				onSuccess: text => {
					task.output = text;
				}
			} );
		},
		options: {
			persistentOutput: true
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
	}
], getListrOptions( cliArguments ) );

( async () => {
	try {
		if ( process.env.CKE5_RELEASE_TOKEN ) {
			githubToken = process.env.CKE5_RELEASE_TOKEN;
		} else {
			githubToken = await provideToken();
		}

		await tasks.run();
	} catch ( err ) {
		process.exitCode = 1;

		console.error( err );
	}
} )();
