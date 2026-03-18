#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import runSnykCommand from '../lib/run-snyk-command.js';

const SNYK_ENDPOINT = 'https://api.eu.snyk.io';

try {
	const { CIRCLE_BRANCH, SNYK_TOKEN } = process.env;

	const { values } = parseArgs( {
		options: {
			organization: {
				type: 'string'
			}
		},
		strict: true
	} );

	if ( !values.organization ) {
		throw new Error( 'Missing required argument: --organization' );
	}

	if ( !SNYK_TOKEN ) {
		throw new Error( 'Missing environment variable: SNYK_TOKEN' );
	}

	if ( !CIRCLE_BRANCH ) {
		throw new Error( 'Missing environment variable: CIRCLE_BRANCH' );
	}

	await runSnykCommand( [ 'config', 'set', `endpoint=${ SNYK_ENDPOINT }` ] );
	await runSnykCommand( [ 'config', 'set', `org=${ values.organization }` ] );

	await runSnykCommand(
		[
			'code',
			'test',
			'--report',
			'--project-name=Code analysis',
			`--target-reference=${ CIRCLE_BRANCH }`
		],

		/**
		 * Snyk CLI returns exit code 1 when vulnerabilities are found. Since we want to publish
		 * the snapshot even if there are some vulnerabilities, we need to allow exit code 1.
		 */
		[ 0, 1 ]
	);

	await runSnykCommand(
		[
			'monitor',
			'--all-projects',
			'--detection-depth=2',
			`--target-reference=${ CIRCLE_BRANCH }`
		],

		/**
		 * Unlike `snyk code test --report`, `snyk monitor` reports a successful snapshot upload
		 * only with exit code 0. Any other exit code means the dependency snapshot was not created.
		 */
		[ 0 ]
	);
} catch ( error ) {
	console.error( error );
	process.exitCode = 1;
}
