#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { validateGithubToken } from '@ckeditor/ckeditor5-dev-release-tools';

try {
	const token = process.env.CKE5_RELEASE_TOKEN;

	if ( !token ) {
		throw new Error( 'CKE5_RELEASE_TOKEN is unavailable.' );
	}

	await validateGithubToken( token );

	console.log( 'The GitHub release token was validated successfully.' );
} catch ( error ) {
	console.error( error.message );
	process.exitCode = 1;
}
