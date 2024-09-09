#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import circleUpdateAutoCancelBuilds from '../lib/circle-update-auto-cancel-builds.js';

/**
 * This script updates CircleCI settings to enable the "Auto-cancel redundant workflows" option.
 *
 * It should be done only if a release workflow uses the `ckeditor5-dev-ci-circle-disable-auto-cancel-builds`
 * script to disable the same option.
 *
 * In order to integrate the action in your pipeline, you need prepare a few environment variables:
 *
 *   - CKE5_CIRCLE_TOKEN - an authorization token to talk to CircleCI REST API.
 *   - CKE5_GITHUB_ORGANIZATION - your GitHub organization.
 *   - CKE5_GITHUB_REPOSITORY - your GitHub repository.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-circle-enable-auto-cancel-builds
 */

const {
	CKE5_CIRCLE_TOKEN,
	CKE5_GITHUB_ORGANIZATION,
	CKE5_GITHUB_REPOSITORY
} = process.env;

const options = {
	circleToken: CKE5_CIRCLE_TOKEN,
	githubOrganization: CKE5_GITHUB_ORGANIZATION,
	githubRepository: CKE5_GITHUB_REPOSITORY,
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
