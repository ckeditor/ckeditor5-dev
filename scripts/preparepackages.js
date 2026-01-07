#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import { Listr } from 'listr2';
import { ListrInquirerPromptAdapter } from '@listr2/prompt-adapter-inquirer';
import { confirm } from '@inquirer/prompts';
import { globSync } from 'glob';
import * as releaseTools from '@ckeditor/ckeditor5-dev-release-tools';
import parseArguments from './utils/parsearguments.js';
import getListrOptions from './utils/getlistroptions.js';
import runBuildCommand from './utils/runbuildcommand.js';
import { CKEDITOR5_DEV_ROOT, PACKAGES_DIRECTORY, RELEASE_DIRECTORY } from './utils/constants.js';

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
		},
		skip: () => {
			// When compiling the packages only, do not validate the release.
			if ( cliArguments.compileOnly ) {
				return true;
			}

			return false;
		}
	},
	{
		title: 'Check the release directory.',
		task: async ( ctx, task ) => {
			const isAvailable = await fs.exists( RELEASE_DIRECTORY );

			if ( !isAvailable ) {
				return fs.ensureDir( RELEASE_DIRECTORY );
			}

			const isEmpty = ( await fs.readdir( RELEASE_DIRECTORY ) ).length === 0;

			if ( isEmpty ) {
				return Promise.resolve();
			}

			// Do not ask when running on CI.
			if ( cliArguments.ci ) {
				return fs.emptyDir( RELEASE_DIRECTORY );
			}

			const shouldContinue = await task.prompt( ListrInquirerPromptAdapter )
				.run( confirm, {
					message: 'The release directory must be empty. Continue and remove all files?'
				} );

			if ( !shouldContinue ) {
				return Promise.reject( 'Aborting as requested.' );
			}

			return fs.emptyDir( RELEASE_DIRECTORY );
		}
	},
	{
		title: 'Updating the `#version` field.',
		task: () => {
			return releaseTools.updateVersions( {
				packagesDirectory: PACKAGES_DIRECTORY,
				version: latestVersion
			} );
		},
		skip: () => {
			// When compiling the packages only, do not validate the release.
			if ( cliArguments.compileOnly ) {
				return true;
			}

			return false;
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
		title: 'Updating dependencies.',
		task: () => {
			return releaseTools.updateDependencies( {
				version: '^' + latestVersion,
				packagesDirectory: RELEASE_DIRECTORY,
				shouldUpdateVersionCallback: packageName => {
					return CKEDITOR5_DEV_PACKAGES.includes( packageName.split( '/' )[ 1 ] );
				}
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
		title: 'Verify release directory.',
		task: async () => {
			const isEmpty = ( await fs.readdir( RELEASE_DIRECTORY ) ).length === 0;

			if ( !isEmpty ) {
				return;
			}

			return Promise.reject( 'Release directory is empty, aborting.' );
		}
	},
	{
		title: 'Commit & tag.',
		task: () => {
			return releaseTools.commitAndTag( {
				version: latestVersion,
				files: [
					'package.json',
					`${ PACKAGES_DIRECTORY }/*/package.json`,
					'pnpm-lock.yaml'
				]
			} );
		},
		skip: () => {
			// When compiling the packages only, do not validate the release.
			if ( cliArguments.compileOnly ) {
				return true;
			}

			return false;
		}
	}
], getListrOptions( cliArguments ) );

tasks.run()
	.catch( err => {
		process.exitCode = 1;

		console.log( '' );
		console.error( err );
	} );
