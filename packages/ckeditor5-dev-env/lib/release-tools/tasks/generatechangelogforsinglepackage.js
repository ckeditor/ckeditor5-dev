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
 * @param {Number} [options.indentLevel=0] The indent level. This function could be used inside another (bigger) script. If we would like to
 * display indents logs, we need to increase/decrease indent level manually.
 * @param {Boolean} [options.useExplicitBreakingChangeGroups] If set on `true`, notes from parsed commits will be grouped as
 * "MINOR BREAKING CHANGES" and "MAJOR BREAKING CHANGES'. If set on `false` (by default), all breaking changes notes will be treated
 * as "BREAKING CHANGES".
 * @returns {Promise}
 */
module.exports = function generateChangelogForSinglePackage( options = {} ) {
	const log = logger();
	const packageJson = getPackageJson();
	const indentLevel = options.indentLevel || 0;
	const indent = ' '.repeat( indentLevel * cli.INDENT_SIZE );

	let tagName = versionUtils.getLastFromChangelog();

	if ( tagName ) {
		tagName = 'v' + tagName;
	}

	let isInternalRelease = options.isInternalRelease || false;
	const newVersion = options.newVersion || null;

	log.info( '\n' + indent + chalk.bold( `Generating changelog for "${ chalk.underline( packageJson.name ) }"...` ) );

	let promise = Promise.resolve();

	// For the internal release, the user does not have to confirm anything. The internal release is called automatically
	// when changelogs of package's dependencies have been changed. We mark the package as "ready to release"
	// in order to update versions of the dependencies.
	if ( isInternalRelease ) {
		if ( VALID_SEMVER_INCREMENT_LEVEL.includes( newVersion ) ) {
			promise = promise.then( () => semver.inc( packageJson.version, newVersion ) );
		} else if ( semver.valid( newVersion ) ) {
			promise = promise.then( () => newVersion );
		} else {
			return Promise.reject( new Error(
				`If "isInternalRelease" is set on true, "newVersion" must be a version or increment level. Given "${ newVersion }".`
			) );
		}
	} else {
		const transformCommitFunction = transformCommitForSubRepositoryFactory( {
			treatMajorAsMinorBreakingChange: options.disableMajorBump,
			returnInvalidCommit: true,
			useExplicitBreakingChangeGroups: !!options.useExplicitBreakingChangeGroups
		} );

		promise = promise
			.then( () => getNewReleaseType( transformCommitFunction, { tagName } ) )
			.then( result => {
				displayCommits( result.commits, { indentLevel: indentLevel + 1 } );

				return cli.provideVersion( packageJson.version, semver.valid( newVersion ) ? newVersion : result.releaseType );
			} );
	}

	return promise
		.then( version => {
			if ( version === 'skip' ) {
				return Promise.resolve();
			}

			// If the user provided "internal" as a new version, we treat it as a "patch" bump.
			if ( version === 'internal' ) {
				isInternalRelease = true;
				version = semver.inc( packageJson.version, 'patch' );
			}

			const changelogOptions = {
				version,
				tagName,
				isInternalRelease,
				indentLevel,
				newTagName: 'v' + version,
				transformCommit: transformCommitForSubRepositoryFactory( {
					treatMajorAsMinorBreakingChange: options.disableMajorBump,
					useExplicitBreakingChangeGroups: !!options.useExplicitBreakingChangeGroups
				} ),
				skipLinks: !!options.skipLinks
			};

			return generateChangelogFromCommits( changelogOptions )
				.then( () => {
					tools.shExec( `git add ${ changelogUtils.changelogFile }`, { verbosity: 'error' } );
					tools.shExec( 'git commit -m "Docs: Changelog. [skip ci]"', { verbosity: 'error' } );

					const message = `Changelog for "${ chalk.underline( packageJson.name ) }" (v${ version }) has been generated.`;

					log.info( chalk.green( indent + message ) );

					return Promise.resolve( version );
				} );
		} );
};
