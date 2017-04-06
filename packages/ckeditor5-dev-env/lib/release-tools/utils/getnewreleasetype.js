/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const conventionalCommitsParser = require( 'conventional-commits-parser' );
const conventionalCommitsFilter = require( 'conventional-commits-filter' );
const gitRawCommits = require( 'git-raw-commits' );
const concat = require( 'concat-stream' );
const parserOptions = require( './parser-options' );
const { availableCommitTypes } = require( './transform-commit-utils' );
const getPackageJson = require( './getpackagejson' );
const versions = require( './versions' );

/**
 * Returns a type (major, minor, patch) of the next release based on commits.
 *
 * If given package has not changed, suggested version will be equal to 'skip'.
 *
 * @param {Function} transformCommit
 * @param {Boolean} isDevPackage Is the function called in a repository
 * with multiple packages (which is management by Lerna).
 * @returns {Promise}
 */
module.exports = function getNewReleaseType( transformCommit, isDevPackage ) {
	const packageJson = getPackageJson();
	let fromVersion = versions.getLastFromChangelog();

	if ( fromVersion ) {
		if ( isDevPackage ) {
			fromVersion = packageJson.name + '@' + fromVersion;
		} else {
			fromVersion = 'v' + fromVersion;
		}
	}

	const gitRawCommitsOpts = {
		format: '%B%n-hash-%n%H',
		from: fromVersion,
		merges: undefined,
		firstParent: true
	};

	const context = {
		displayLogs: true,
		packageData: packageJson
	};

	return new Promise( ( resolve, reject ) => {
		gitRawCommits( gitRawCommitsOpts )
			.on( 'error', reject )
			.pipe( conventionalCommitsParser( parserOptions ) )
			.pipe( concat( ( data ) => {
				const commits = conventionalCommitsFilter( data );
				const releaseType = getNewVersionType( commits );

				return resolve( { releaseType } );
			} ) );
	} );

	// Returns a type of version for a release based on the commits.
	//
	// @param {Array} commits
	// @returns {String}
	function getNewVersionType( commits ) {
		let hasNewFeatures = false;
		let hasChanges = false;

		for ( const item of commits ) {
			const singleCommit = transformCommit( item, context );

			if ( !singleCommit ) {
				continue;
			}

			// Check whether the commit is visible in changelog.
			if ( !availableCommitTypes.get( singleCommit.rawType ) ) {
				continue;
			}

			hasChanges = true;

			for ( const note of singleCommit.notes ) {
				if ( note.title === 'BREAKING CHANGES' ) {
					return 'major';
				}
			}

			if ( !hasNewFeatures && singleCommit.rawType === 'Feature' ) {
				hasNewFeatures = true;
			}
		}

		if ( !hasChanges ) {
			return 'skip';
		}

		return hasNewFeatures ? 'minor' : 'patch';
	}
};
