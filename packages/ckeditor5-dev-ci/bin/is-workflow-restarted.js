#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * This script checks if the provided workflow has been restarted.
 *
 * In order to integrate the action in your pipeline, you need prepare a few environment variables:
 *
 *   - CIRCLE_WORKFLOW_ID - provided by default by CircleCI and keeps the workflow id.
 *   - CKE5_CIRCLE_TOKEN - an authorization token to talk to CircleCI REST API.
 *
 * Example usage:
 * CKE5_CIRCLE_TOKEN=... ckeditor5-dev-ci-is-workflow-restarted
 */

const {
	CKE5_CIRCLE_TOKEN,
	CIRCLE_WORKFLOW_ID
} = process.env;

const requestUrl = `https://circleci.com/api/v2/workflow/${ CIRCLE_WORKFLOW_ID }`;

const requestOptions = {
	method: 'GET',
	headers: {
		'Circle-Token': CKE5_CIRCLE_TOKEN
	}
};

fetch( requestUrl, requestOptions )
	.then( res => res.json() )
	.then( response => {
		console.log( 'status = ', response.status );
		console.log( 'tag = ', response.tag );
	} );
