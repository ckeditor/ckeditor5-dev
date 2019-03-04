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
 * It returns a promise that resolves the `releaseType` and all `commits` that have been checked.
 *
 * @param {Function} transformCommit
 * @param {Object} options
 * @param {String|null} options.tagName Name of the last created tag for the repository.
 * @returns {Promise.<Object>}
 */
module.exports = function getNewReleaseType( transformCommit, options = {} ) {
	const gitRawCommitsOpts = {
		format: '%B%n-hash-%n%H',
		from: options.tagName,
		merges: undefined,
		firstParent: true
	};

	const context = {
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
						`Cannot find tag "${ options.tagName }" (the latest version from the changelog) in given repository.`
					) );
				} else {
					reject( err );
				}
			} )
			.pipe( conventionalCommitsParser( parserOptions ) )
			.pipe( concat( data => {
				const commits = conventionalCommitsFilter( data )
					.map( commit => transformCommit( commit, context ) )
					.filter( commit => commit );

				return resolve( {
					releaseType: getNewVersionType( commits ),
					commits
				} );
			} ) );
	} );

	// Returns a type of version for a release based on the commits.
	//
	// @param {Array.<Commit>} commits
	// @returns {String}
	function getNewVersionType( commits ) {
		// Repository does not have new changes.
		if ( !commits.length ) {
			return 'skip';
		}

		const publicCommits = commits.filter( commit => availableCommitTypes.get( commit.rawType ) );

		if ( !publicCommits.length ) {
			return 'internal';
		}

		let newFeatures = false;

		for ( const commit of publicCommits ) {
			for ( const note of commit.notes ) {
				if ( note.title === 'BREAKING CHANGES' ) {
					return 'major';
				}
			}

			if ( !newFeatures && commit.rawType === 'Feature' ) {
				newFeatures = true;
			}
		}

		// Repository has new features without breaking changes.
		if ( newFeatures ) {
			return 'minor';
		}

		return 'patch';
	}
};
