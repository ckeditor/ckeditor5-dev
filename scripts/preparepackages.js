#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const upath = require( 'upath' );
const { Listr } = require( 'listr2' );
const { globSync } = require( 'glob' );
const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );
const parseArguments = require( './utils/parsearguments' );
const runBuildCommand = require( './utils/runbuildcommand' );
const { CKEDITOR5_DEV_ROOT, PACKAGES_DIRECTORY, RELEASE_DIRECTORY } = require( './utils/constants' );

const cliArguments = parseArguments( process.argv.slice( 2 ) );
const latestVersion = releaseTools.getLastFromChangelog();
const versionChangelog = releaseTools.getChangesForVersion( latestVersion );
const CKEDITOR5_DEV_PACKAGES = globSync( '*/', {
	cwd: upath.join( CKEDITOR5_DEV_ROOT, PACKAGES_DIRECTORY )
} );

const tasks = new Listr( [
	{
		title: 'Verifying the repository.',
		task: async () => {
			const errors = await releaseTools.validateRepositoryToRelease( {
				version: latestVersion,
				changes: versionChangelog,
				branch: cliArguments.branch
			} );

			if ( !errors.length ) {
				return;
			}

			return Promise.reject( 'Aborted due to errors.\n' + errors.map( message => `* ${ message }` ).join( '\n' ) );
		}
	},
	{
		title: 'Updating the `#version` field.',
		task: () => {
			return releaseTools.updateVersions( {
				packagesDirectory: PACKAGES_DIRECTORY,
				version: latestVersion
			} );
		}
	},
	{
		title: 'Updating dependencies.',
		task: () => {
			return releaseTools.updateDependencies( {
				version: '^' + latestVersion,
				packagesDirectory: PACKAGES_DIRECTORY,
				shouldUpdateVersionCallback: packageName => {
					return CKEDITOR5_DEV_PACKAGES.includes( packageName.split( '/' )[ 1 ] );
				}
			} );
		}
	},
	{
		title: 'Run the "build" command in `ckeditor5-*` packages.',
		task: ( ctx, task ) => {
			return releaseTools.executeInParallel( {
				packagesDirectory: PACKAGES_DIRECTORY,
				listrTask: task,
				taskToExecute: runBuildCommand,
				concurrency: cliArguments.concurrency
			} );
		}
	},
	{
		title: 'Copying `ckeditor5-dev-*` packages to the release directory.',
		task: () => {
			return releaseTools.prepareRepository( {
				outputDirectory: RELEASE_DIRECTORY,
				packagesDirectory: PACKAGES_DIRECTORY,
				packagesToCopy: cliArguments.packages
			} );
		}
	},
	{
		title: 'Cleaning-up.',
		task: () => {
			return releaseTools.cleanUpPackages( {
				packagesDirectory: RELEASE_DIRECTORY,
				preservePostInstallHook: true
			} );
		}
	},
	{
		title: 'Commit & tag.',
		task: () => {
			return releaseTools.commitAndTag( {
				version: latestVersion,
				files: [
					'package.json',
					`${ PACKAGES_DIRECTORY }/*/package.json`
				]
			} );
		}
	}
] );

tasks.run()
	.catch( err => {
		process.exitCode = 1;

		console.log( '' );
		console.error( err );
	} );
