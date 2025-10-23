#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'util';
import circleUpdateAutoCancelBuilds from '../lib/circle-update-auto-cancel-builds.js';

/**
 * This script updates CircleCI settings to disable the "Auto-cancel redundant workflows" option.
 *
 * It's needed when triggering a release process via CI to avoid canceling the release workflow by pushing
 * a new commit (the released one) that will trigger a new pipeline.
 *
 * In order to integrate the action in your pipeline, you need prepare a few CLI or environment variables:
 *
 *   - `CKE5_CIRCLE_TOKEN` - an authorization token to talk to CircleCI REST API.
 *   - `--organization` - a GitHub organization.
 *   - `--repository` - a GitHub repository.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-circle-disable-auto-cancel-builds --organization ... --repository ...
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
	newValue: false
};

circleUpdateAutoCancelBuilds( options )
	.then( () => {
		console.log( 'Auto-cancel redundant workflows is now disabled.' );
	} )
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );
