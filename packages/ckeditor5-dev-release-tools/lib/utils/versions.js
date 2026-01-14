/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver from 'semver';
import { npm, tools, workspaces } from '@ckeditor/ckeditor5-dev-utils';
import getChangelog from './getchangelog.js';

/**
 * Returns a last created version in changelog file.
 *
 * @param {string} [cwd=process.cwd()] Where to look for the changelog file.
 * @returns {string|null}
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
 * It takes into account and distinguishes pre-release tags with different names but starting with the same base name.
 * If the package does not have any pre-releases with the provided identifier yet, `null` is returned.
 *
 * Examples:
 * 	* "0.0.0-nightly" - Matches the last "nightly" version regardless of the publication date.
 *	  It does not match other nightly tags that start with the same "nightly" base name, e.g. "0.0.0-nightly-next-YYYYMMDD.X".
 * 	* "0.0.0-nightly-20230615" - Matches the last "nightly" version from the 2023-06-15 day.
 * 	* "42.0.0-alpha" - Matches the last "alpha" version for the 42.0.0 version.
 *
 * @param {ReleaseIdentifier} releaseIdentifier
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise.<string|null>}
 */
export function getLastPreRelease( releaseIdentifier, cwd = process.cwd() ) {
	const { name: packageName } = workspaces.getPackageJson( cwd );

	return npm.packument( packageName )
		.then( result => {
			const lastVersion = Object.keys( result.versions )
				.filter( version => {
					const optionalDateIdentifier = '(-[0-9]{8})?';
					const optionalSequenceNumber = '(\\.[0-9]+)?';
					const versionRegExp = new RegExp( `^${ releaseIdentifier }${ optionalDateIdentifier }${ optionalSequenceNumber }$` );

					return versionRegExp.test( version );
				} )
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
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise.<string|null>}
 */
export function getLastNightly( cwd = process.cwd() ) {
	return getLastPreRelease( '0.0.0-nightly', cwd );
}

/**
 * Returns the next available pre-release version that matches the following format: "<releaseIdentifier>.X", where "X" is the
 * next available pre-release sequential number starting from 0.
 *
 * @param {ReleaseIdentifier} releaseIdentifier
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise<string>}
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
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise<string>}
 */
export async function getNextNightly( cwd = process.cwd() ) {
	const nextNightlyReleaseIdentifier = `0.0.0-nightly-${ getDateIdentifier() }`;

	return getNextPreRelease( nextNightlyReleaseIdentifier, cwd );
}

/**
 * Returns the next available internal version in the format of "0.0.0-internal-YYYYMMDD.X", where the "YYYYMMDD" is the current date for
 * the internal release and the "X" is the sequential number starting from 0.
 *
 * @param {string} [cwd=process.cwd()]
 * @returns {Promise<string>}
 */
export async function getNextInternal( cwd = process.cwd() ) {
	const nextInternalReleaseIdentifier = `0.0.0-internal-${ getDateIdentifier() }`;

	return getNextPreRelease( nextInternalReleaseIdentifier, cwd );
}

/**
 * Returns a name of the last created tag.
 *
 * @returns {string|null}
 */
export function getLastTagFromGit() {
	try {
		const lastTag = tools.shExec( 'git describe --abbrev=0 --tags 2> /dev/null', { verbosity: 'error' } );

		return lastTag.trim().replace( /^v/, '' ) || null;
	} catch {
		/* istanbul ignore next */
		return null;
	}
}

/**
 * Returns version of current package from `package.json`.
 *
 * @param {string} [cwd=process.cwd()] Current work directory.
 * @returns {string}
 */
export function getCurrent( cwd = process.cwd() ) {
	return workspaces.getPackageJson( cwd ).version;
}

/**
 * Returns current date in the "YYYYMMDD" format.
 *
 * @returns {string}
 */
export function getDateIdentifier() {
	const today = new Date();
	const year = today.getFullYear().toString();
	const month = ( today.getMonth() + 1 ).toString().padStart( 2, '0' );
	const day = today.getDate().toString().padStart( 2, '0' );

	return `${ year }${ month }${ day }`;
}

/**
 * Returns the latest version of the package on the npm tag.
 * If the package does not have any version on that tag yet, `null` is returned.
 *
 * @param {string} packageName
 * @param {string} npmTag
 * @returns {Promise.<string|null>}
 */
export function getVersionForTag( packageName, npmTag ) {
	return npm.manifest( `${ packageName }@${ npmTag }` )
		.then( result => result.version )
		.catch( () => null );
}

/**
 * Checks if the version can be considered as the newest stable release of the package.
 * It checks whether the version given in the argument is or could be the latest version.
 * The package may not have this version published on npm yet, but it is also considered as the latest stable.
 *
 * @param {string} packageName
 * @param {string} version
 * @returns {Promise.<boolean>}
 */
export async function isLatestOrNextStableVersion( packageName, version ) {
	if ( semver.prerelease( version ) ) {
		return false;
	}

	const npmVersion = await getVersionForTag( packageName, 'latest' );

	if ( npmVersion && semver.lt( version, npmVersion ) ) {
		return false;
	}

	return true;
}

/**
 * Verifies if the package can be published in the provided version on the npm tag.
 *
 * @param {string} packageName
 * @param {string} version
 * @param {string} npmTag
 * @returns {Promise.<boolean>}
 */
export async function isVersionPublishableForTag( packageName, version, npmTag ) {
	const npmVersion = await getVersionForTag( packageName, npmTag );

	if ( npmVersion && semver.lte( version, npmVersion ) ) {
		return false;
	}

	return true;
}

/**
 * @typedef {string} ReleaseIdentifier The pre-release identifier without the last dynamic part (the pre-release sequential number).
 * It consists of the core base version ("<major>.<minor>.<path>"), a hyphen ("-"), and a pre-release identifier name (e.g. "alpha").
 */
