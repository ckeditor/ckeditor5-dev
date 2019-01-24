/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
		returnInvalidCommit: true,
		packageData: getPackageJson()
	};

	return new Promise( ( resolve, reject ) => {
		gitRawCommits( gitRawCommitsOpts )
			.on( 'error', err => {
				if ( err.message.match( /'HEAD': unknown/ ) ) {
					reject( new Error( 'Given repository is empty.' ) );
				} else if ( err.message.match( new RegExp( `'${ options.tagName }\\.\\.HEAD': unknown` ) ) ) {
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
		let haveValidChanges = false;
		let newFeatures = false;
		let publicChanges = false;
		let internalChanges = false;

		for ( const item of commits ) {
			const singleCommit = transformCommit( item, context );

			if ( !singleCommit ) {
				continue;
			}

			haveValidChanges = true;

			// Check whether the commit is visible in changelog.
			if ( !availableCommitTypes.get( singleCommit.rawType ) ) {
				internalChanges = true;

				continue;
			}

			publicChanges = true;

			for ( const note of singleCommit.notes ) {
				if ( note.title === 'BREAKING CHANGES' ) {
					return 'major';
				}
			}

			if ( !newFeatures && singleCommit.rawType === 'Feature' ) {
				newFeatures = true;
			}
		}

		// Repository does not have new changes.
		if ( !haveValidChanges ) {
			return 'skip';
		}

		// Repository contains internal changes only.
		if ( !publicChanges && internalChanges ) {
			return 'internal';
		}

		// Repository has new features without breaking changes.
		if ( newFeatures ) {
			return 'minor';
		}

		return 'patch';
	}
};
