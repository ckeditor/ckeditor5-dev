#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'util';
import triggerCircleBuild from '../lib/trigger-circle-build.js';

/**
 * This script triggers a new CircleCI build.
 *
 * In order to integrate the action in your pipeline, you need prepare a few CLI or environment variables:
 *
 *   - `CIRCLE_BRANCH` - provided by default by CircleCI and keeps the git branch of processed pipeline.
 *   - `CIRCLE_SHA1` - provided by default by CircleCI and keeps a full commit identifier of the processed the pipeline.
 *   - `CKE5_CIRCLE_TOKEN` - an authorization token to talk to CircleCI REST API.
 *   - `--slug` - a repository slug (org/name) where a new pipeline will be started.
 *   - `--trigger-repository-slug` - (optional) a repository slug (org/name) that triggers a new pipeline.
 *     Can be skipped when overlaps with `--slug`.
 *   - `--release-branch` - (optional) define a branch that leads the release process.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-trigger-circle-build
 */

const { values: cliOptions } = parseArgs( {
	options: {
		slug: {
			type: 'string',
			default: process.env.CKE5_GITHUB_REPOSITORY_SLUG
		},
		'trigger-repository-slug': {
			type: 'string',
			default: process.env.CKE5_GITHUB_TRIGGER_REPOSITORY_SLUG
		},
		'release-branch': {
			type: 'string',
			default: process.env.CKE5_GITHUB_RELEASE_BRANCH
		}
	}
} );

const options = {
	circleToken: process.env.CKE5_CIRCLE_TOKEN,
	commit: process.env.CIRCLE_SHA1,
	branch: process.env.CIRCLE_BRANCH,
	releaseBranch: cliOptions[ 'release-branch' ],
	repositorySlug: cliOptions.slug
};

if ( cliOptions[ 'trigger-repository-slug' ] ) {
	options.triggerRepositorySlug = cliOptions[ 'trigger-repository-slug' ];
}

triggerCircleBuild( options )
	.then( () => {
		console.log( 'CI triggered successfully.' );
	} )
	.catch( err => {
		console.error( err );

		process.exit( 1 );
	} );
