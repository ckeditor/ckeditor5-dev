/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const conventionalCommitsParser = require( 'conventional-commits-parser' );
const conventionalCommitsFilter = require( 'conventional-commits-filter' );
const gitRawCommits = require( 'git-raw-commits' );
const concat = require( 'concat-stream' );
const parserOptions = require( './transform-commit/parser-options' );
const { availableCommitTypes } = require( './transform-commit/transform-commit-utils' );
const getPackageJson = require( './getpackagejson' );

/**
 * Returns a type (major, minor, patch) of the next release based on commits.
 *
 * If given package has not changed, suggested version will be equal to 'skip'.
 *
 * @param {Function} transformCommit
 * @param {Object} options
 * @param {String|null} options.tagName Name of the last created tag for the repository.
 * @returns {Promise}
 */
module.exports = function getNewReleaseType( transformCommit, options = {} ) {
	const gitRawCommitsOpts = {
		format: '%B%n-hash-%n%H',
		from: options.tagName,
		merges: undefined,
		firstParent: true
	};

	const context = {
		displayLogs: true,
		packageData: getPackageJson()
	};

	return new Promise( ( resolve, reject ) => {
		gitRawCommits( gitRawCommitsOpts )
			.on( 'error', err => {
				if ( err.message.match( /'HEAD': unknown/ ) ) {
					reject( new Error( 'Given repository is empty.' ) );
				} else if ( err.message.match( new RegExp( `'${ options.tagName }\.\.HEAD': unknown` ) ) ) {
					reject( new Error(
						`Cannot find tag "${ options.tagName }" (the latest version from the changelog) ` +
						'in given repository.'
					) );
				} else {
					reject( err );
				}
			} )
			.pipe( conventionalCommitsParser( parserOptions ) )
			.pipe( concat( data => {
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
		let hasBreakingChanges = false;

		for ( const item of commits ) {
			const singleCommit = transformCommit( item, context );

			if ( !singleCommit ) {
				continue;
			}

			hasChanges = true;

			// Check whether the commit is visible in changelog.
			if ( !availableCommitTypes.get( singleCommit.rawType ) ) {
				continue;
			}

			for ( const note of singleCommit.notes ) {
				if ( note.title === 'BREAKING CHANGES' ) {
					hasBreakingChanges = true;
				}
			}

			if ( !hasNewFeatures && singleCommit.rawType === 'Feature' ) {
				hasNewFeatures = true;
			}
		}

		// Repository does not have new changes - skip the release.
		if ( !hasChanges ) {
			return 'skip';
		}

		// Repository has breaking changes - bump the major.
		if ( hasBreakingChanges ) {
			return 'major';
		}

		// Repository has new features without breaking changes - bump the minor.
		if ( hasNewFeatures ) {
			return 'minor';
		}

		return 'patch';
	}
};
