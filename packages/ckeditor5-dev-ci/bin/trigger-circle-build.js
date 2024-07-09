/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const triggerCircleBuild = require( '../lib/trigger-circle-build' );

/**
 * This script triggers a new CircleCI build.
 *
 * In order to integrate the action in your pipeline, you need prepare a few environment variables:
 *
 *   - CIRCLE_BRANCH - provided by default by CircleCI and keeps the git branch of processed build.
 *   - CKE5_COMMIT_SHA1 - a full commit identifier of the processed the build.
 *   - CKE5_CIRCLE_TOKEN - an authorization token to talk to CircleCI REST API.
 *   - CKE5_GITHUB_REPOSITORY_SLUG - a repository slug (org/name) where a new build will be started.
 *   - CKE5_GITHUB_RELEASE_BRANCH - (optional) define a branch that leads the release process.
 *   - CKE5_GITHUB_TRIGGER_REPOSITORY_SLUG - (optional) a repository slug (org/name) that triggers a new build.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-trigger-circle-build
 */

const {
	CKE5_COMMIT_SHA1,
	CIRCLE_BRANCH,
	CKE5_CIRCLE_TOKEN,
	CKE5_GITHUB_RELEASE_BRANCH,
	CKE5_GITHUB_REPOSITORY_SLUG,
	CKE5_GITHUB_TRIGGER_REPOSITORY_SLUG
} = process.env;

const options = {
	circleToken: CKE5_CIRCLE_TOKEN,
	commit: CKE5_COMMIT_SHA1,
	branch: CIRCLE_BRANCH,
	releaseBranch: CKE5_GITHUB_RELEASE_BRANCH,
	repositorySlug: CKE5_GITHUB_REPOSITORY_SLUG,
	triggerRepositorySlug: CKE5_GITHUB_TRIGGER_REPOSITORY_SLUG
};

if ( CKE5_GITHUB_TRIGGER_REPOSITORY_SLUG ) {
	options.triggerRepositorySlug = CKE5_GITHUB_TRIGGER_REPOSITORY_SLUG;
}

triggerCircleBuild( options )
	.then( () => {
		console.log( 'CI triggered successfully.' );
	} )
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );
