#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'util';
import circleUpdateAutoCancelBuilds from '../lib/circle-update-auto-cancel-builds.js';

/**
 * This script updates CircleCI settings to enable the "Auto-cancel redundant workflows" option.
 *
 * It should be done only if a release workflow uses the `ckeditor5-dev-ci-circle-disable-auto-cancel-builds`
 * script to disable the same option.
 *
 * In order to integrate the action in your pipeline, you need prepare a few CLI or environment variables:
 *
 *   - `CKE5_CIRCLE_TOKEN` - an authorization token to talk to CircleCI REST API.
 *   - `--organization` - your GitHub organization.
 *   - `--repository` - your GitHub repository.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-circle-enable-auto-cancel-builds
 */

const { values: cliOptions } = parseArgs( {
	options: {
		organization: {
			type: 'string',
			default: process.env.CKE5_GITHUB_ORGANIZATION
		},
		repository: {
			type: 'string',
			default: process.env.CKE5_GITHUB_REPOSITORY
		}
	}
} );

const options = {
	circleToken: process.env.CKE5_CIRCLE_TOKEN,
	githubOrganization: cliOptions.organization,
	githubRepository: cliOptions.repository,
	newValue: true
};

circleUpdateAutoCancelBuilds( options )
	.then( () => {
		console.log( 'Auto-cancel redundant workflows is now enabled.' );
	} )
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );
