/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import getChangelog from './getchangelog.js';
import { getPackageJson } from './getpackagejson.js';

/**
 * Returns a last created version in changelog file.
 *
 * @param {String} [cwd=process.cwd()] Where to look for the changelog file.
 * @returns {String|null}
 */
export function getLastFromChangelog( cwd = process.cwd() ) {
	const changelog = getChangelog( cwd );

	if ( !changelog ) {
		return null;
	}

	const regexp = /\n## \[?([\da-z.\-+]+)/i;
	const matches = changelog.match( regexp );

	return matches ? matches[ 1 ] : null;
}

/**
 * Returns the current (latest) pre-release version that matches the provided release identifier.
 * If the package does not have any pre-releases with the provided identifier yet, `null` is returned.
 *
 * @param {ReleaseIdentifier} releaseIdentifier
 * @param {String} [cwd=process.cwd()]
 * @returns {Promise.<String|null>}
 */
export function getLastPreRelease( releaseIdentifier, cwd = process.cwd() ) {
	const packageName = getPackageJson( cwd ).name;

	return tools.shExec( `npm view ${ packageName } versions --json`, { verbosity: 'silent', async: true } )
		.then( result => {
			const lastVersion = JSON.parse( result )
				.filter( version => version.startsWith( releaseIdentifier ) )
				.sort( ( a, b ) => a.localeCompare( b, undefined, { numeric: true } ) )
				.pop();

			return lastVersion || null;
		} )
		.catch( () => null );
}

/**
 * Returns the current (latest) nightly version in the format of "0.0.0-nightly-YYYYMMDD.X", where the "YYYYMMDD" is the date of the
 * last nightly release and the "X" is the sequential number starting from 0. If the package does not have any nightly releases yet,
 * `null` is returned.
 *
 * @param {String} [cwd=process.cwd()]
 * @returns {Promise.<String|null>}
 */
export function getLastNightly( cwd = process.cwd() ) {
	return getLastPreRelease( '0.0.0-nightly', cwd );
}

/**
 * Returns the next available pre-release version that matches the following format: "<releaseIdentifier>.X", where "X" is the
 * next available pre-release sequential number starting from 0.
 *
 * @param {ReleaseIdentifier} releaseIdentifier
 * @param {String} [cwd=process.cwd()]
 * @returns {Promise<String>}
 */
export async function getNextPreRelease( releaseIdentifier, cwd = process.cwd() ) {
	const currentPreReleaseVersion = await getLastPreRelease( releaseIdentifier, cwd );

	if ( !currentPreReleaseVersion ) {
		return `${ releaseIdentifier }.0`;
	}

	const currentPreReleaseVersionTokens = currentPreReleaseVersion.split( '.' );
	const currentPreReleaseSequenceNumber = currentPreReleaseVersionTokens.pop();
	const currentPreReleaseIdentifier = currentPreReleaseVersionTokens.join( '.' );
	const nextPreReleaseSequenceNumber = Number( currentPreReleaseSequenceNumber ) + 1;

	return `${ currentPreReleaseIdentifier }.${ nextPreReleaseSequenceNumber }`;
}

/**
 * Returns the next available nightly version in the format of "0.0.0-nightly-YYYYMMDD.X", where the "YYYYMMDD" is the current date for
 * the nightly release and the "X" is the sequential number starting from 0.
 *
 * @param {String} [cwd=process.cwd()]
 * @returns {Promise<String>}
 */
export async function getNextNightly( cwd = process.cwd() ) {
	const today = new Date();
	const year = today.getFullYear().toString();
	const month = ( today.getMonth() + 1 ).toString().padStart( 2, '0' );
	const day = today.getDate().toString().padStart( 2, '0' );

	const nextNightlyReleaseIdentifier = `0.0.0-nightly-${ year }${ month }${ day }`;

	return getNextPreRelease( nextNightlyReleaseIdentifier, cwd );
}

/**
 * Returns a name of the last created tag.
 *
 * @returns {String|null}
 */
export function getLastTagFromGit() {
	try {
		const lastTag = tools.shExec( 'git describe --abbrev=0 --tags 2> /dev/null', { verbosity: 'error' } );

		return lastTag.trim().replace( /^v/, '' ) || null;
	} catch ( err ) {
		/* istanbul ignore next */
		return null;
	}
}

/**
 * Returns version of current package from `package.json`.
 *
 * @param {String} [cwd=process.cwd()] Current work directory.
 * @returns {String}
 */
export function getCurrent( cwd = process.cwd() ) {
	return getPackageJson( cwd ).version;
}

/**
 * @typedef {String} ReleaseIdentifier The pre-release identifier without the last dynamic part (the pre-release sequential number).
 * It consists of the core base version ("<major>.<minor>.<path>"), a hyphen ("-"), and a pre-release identifier name (e.g. "alpha").
 *
 * Examples:
 * 	* "0.0.0-nightly" - matches the last nightly version regardless of the publication date.
 * 	* "0.0.0-nightly-20230615" - matches the last nightly version from the 2023-06-15 day.
 * 	* "42.0.0-alpha" - matches the last alpha version for the 42.0.0 version.
 */
