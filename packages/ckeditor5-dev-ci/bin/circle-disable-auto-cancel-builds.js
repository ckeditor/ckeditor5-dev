#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const circleUpdateAutoCancelBuilds = require( '../lib/circle-update-auto-cancel-builds' );

/**
 * This script updates CircleCI settings to disable the "Auto-cancel redundant workflows" option.
 *
 * It's needed when triggering a release process via CI to avoid canceling the release workflow by pushing
 * a new commit (the released one) that will trigger a new pipeline.
 *
 * In order to integrate the action in your pipeline, you need prepare a few environment variables:
 *
 *   - CKE5_CIRCLE_TOKEN - an authorization token to talk to CircleCI REST API.
 *   - CKE5_GITHUB_ORGANIZATION - your GitHub organization.
 *   - CKE5_GITHUB_REPOSITORY - your GitHub repository.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-circle-disable-auto-cancel-builds
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
