/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import upath from 'upath';
import semver from 'semver';

/**
 * Checks if the npm tag matches the tag calculated from the package version. Verification takes place for all packages.
 *
 * @param {Array.<string>} packagePaths
 * @param {string} npmTag
 * @returns {Promise}
 */
export default async function assertNpmTag( packagePaths, npmTag ) {
	const errors = [];

	for ( const packagePath of packagePaths ) {
		const packageJsonPath = upath.join( packagePath, 'package.json' );
		const packageJson = await fs.readJson( packageJsonPath );
		const versionTag = getVersionTag( packageJson.version );

		if ( versionTag === npmTag ) {
			continue;
		}

		if ( versionTag === 'latest' && npmTag === 'staging' ) {
			continue;
		}

		errors.push( `The version tag "${ versionTag }" from "${ packageJson.name }" package does not match the npm tag "${ npmTag }".` );
	}

	if ( errors.length ) {
		throw new Error( errors.join( '\n' ) );
	}
}

/**
 * Returns the version tag for the package.
 *
 * For the official release, returns the "latest" tag. For a non-official release (pre-release), returns the version tag extracted from
 * the package version.
 *
 * @param {string} version
 * @returns {string}
 */
function getVersionTag( version ) {
	const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

	if ( versionTag.startsWith( 'nightly' ) ) {
		return 'nightly';
	}

	return versionTag;
}
