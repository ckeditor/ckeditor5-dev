/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs/promises';
import upath from 'upath';
import semver from 'semver';
import getNpmTagFromVersion from './getnpmtagfromversion.js';

const ALLOWED_NPM_LATEST_TAGS = [
	'latest',
	'staging',
	'next'
];

/**
 * Checks if the npm tag matches the tag calculated from the package version. Verification takes place for all packages.
 * Stable versions can additionally use `latest-v{major}` where `{major}` matches the version major.
 *
 * @param {Array.<string>} packagePaths
 * @param {string} npmTag
 * @returns {Promise}
 */
export default async function assertNpmTag( packagePaths, npmTag ) {
	const errors = [];

	for ( const packagePath of packagePaths ) {
		const path = upath.join( packagePath, 'package.json' );
		const file = await fs.readFile( path, 'utf-8' );
		const packageJson = JSON.parse( file );
		const versionTag = getNpmTagFromVersion( packageJson.version );

		if ( versionTag === npmTag ) {
			continue;
		}

		if ( versionTag === 'latest' ) {
			if ( ALLOWED_NPM_LATEST_TAGS.includes( npmTag ) ) {
				continue;
			}

			if ( isValidLatestMajorTag( packageJson.version, npmTag ) ) {
				continue;
			}
		}

		errors.push( `The version tag "${ versionTag }" from "${ packageJson.name }" package does not match the npm tag "${ npmTag }".` );
	}

	if ( errors.length ) {
		throw new Error( errors.join( '\n' ) );
	}
}

function isValidLatestMajorTag( version, npmTag ) {
	const match = npmTag.match( /^latest-v(0|[1-9]\d*)$/ );

	if ( !match ) {
		return false;
	}

	return semver.major( version ) === Number( match[ 1 ] );
}
