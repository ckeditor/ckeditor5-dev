/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const semver = require( 'semver' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const cli = require( '../utils/cli' );
const versionUtils = require( '../utils/versions' );
const changelogUtils = require( '../utils/changelog' );
const displayCommits = require( '../utils/displaycommits' );
const getPackageJson = require( '../utils/getpackagejson' );
const getNewReleaseType = require( '../utils/getnewreleasetype' );
const generateChangelogFromCommits = require( '../utils/generatechangelogfromcommits' );
const transformCommitForSubRepositoryFactory = require( '../utils/transform-commit/transformcommitforsubrepositoryfactory' );

const VALID_SEMVER_INCREMENT_LEVEL = [
	'major',
	'minor',
	'patch',
	'premajor',
	'preminor',
	'prepatch',
	'prerelease'
];

/**
 * Generates the release changelog based on commit messages in a package that is located under current work directory (cwd).
 *
 * A new version that should be printed in the changelog can be specified under `options.newVersion` option.
 * It accepts the new version (e.g. "1.0.0") or a level that describes how to increase a current version of the package,
 * e.g.: "major". It means that the tool will suggest a major version bump while asking about the new version.
 *
 * If the new version is not specified, the tool will print all commits and user must type the new version manually.
 *
 * If the package does not have any commit, the user has to confirm whether the changelog should be generated.
 *
 * @param {Object} [options={}] Additional options.
 * @param {String} [options.newVersion=null] A version or a type of increase level for the current version
 * for which changelog will be generated.
 * @param {Boolean} [options.skipLinks=false] If set on true, links to release or commits will be omitted.
 * @param {Boolean} [options.disableMajorBump=false] If set on true, detected breaking change won't bump the major version.
 * @param {Boolean} [options.isInternalRelease=false] If set on true, the changelog will contain a note about internal release
 * instead of data that comes from commits.
 * @returns {Promise}
 */
module.exports = function generateChangelogForSinglePackage( options = {} ) {
	const log = logger();
	const packageJson = getPackageJson();

	let tagName = versionUtils.getLastFromChangelog();

	if ( tagName ) {
		tagName = 'v' + tagName;
	}

	let isInternalRelease = options.isInternalRelease || false;
	let newVersion = options.newVersion || null;

	if ( newVersion === 'internal' ) {
		isInternalRelease = true;
		newVersion = 'patch';
	}

	log.info( '\n' + chalk.bold.blue( `Generating changelog for "${ packageJson.name }"...` ) );

	let promise = Promise.resolve();

	// There are three cases that we need to handle:
	// 1. `newVersion` is a valid version, e.g. "1.0.0". Use the version without providing additional data.
	// 2. `newVersion` is a level that describes how to increase a current version of the package. The user has to type the new version.
	// 3. `newVersion` is not specified. All commits will be printed out and the user must type the new version.
	if ( semver.valid( newVersion ) ) {
		promise = promise.then( () => newVersion );
	} else if ( VALID_SEMVER_INCREMENT_LEVEL.includes( newVersion ) ) {
		// For the internal releases the user does not have to confirm anything. The internal release is called automatically
		// when changelogs of package's dependencies have been changed. We mark the package as "ready to release"
		// in order to update versions of the dependencies.
		if ( isInternalRelease ) {
			promise = promise.then( () => semver.inc( packageJson.version, newVersion ) );
		} else {
			promise = promise.then( () => cli.provideVersion( packageJson.version, newVersion ) );
		}
	} else {
		const transformCommitFunction = transformCommitForSubRepositoryFactory( {
			treatMajorAsMinorBreakingChange: options.disableMajorBump,
			returnInvalidCommit: true
		} );

		promise = promise
			.then( () => getNewReleaseType( transformCommitFunction, { tagName } ) )
			.then( result => {
				displayCommits( result.commits );

				const newReleaseType = result.releaseType !== 'skip' ? result.releaseType : null;

				return cli.provideVersion( packageJson.version, newReleaseType );
			} );
	}

	return promise
		.then( version => {
			if ( version === 'skip' ) {
				return Promise.resolve();
			}

			const changelogOptions = {
				version,
				tagName,
				isInternalRelease,
				newTagName: 'v' + version,
				transformCommit: transformCommitForSubRepositoryFactory( {
					treatMajorAsMinorBreakingChange: options.disableMajorBump
				} ),
				skipLinks: !!options.skipLinks
			};

			return generateChangelogFromCommits( changelogOptions )
				.then( () => {
					tools.shExec( `git add ${ changelogUtils.changelogFile }`, { verbosity: 'error' } );
					tools.shExec( 'git commit -m "Docs: Changelog. [skip ci]"', { verbosity: 'error' } );

					log.info(
						chalk.green( `Changelog for "${ packageJson.name }" (v${ version }) has been generated.` )
					);

					return Promise.resolve( version );
				} );
		} );
};
