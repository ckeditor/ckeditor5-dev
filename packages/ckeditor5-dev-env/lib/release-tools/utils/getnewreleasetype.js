/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const through = require( 'through2' );
const conventionalCommitsParser = require( 'conventional-commits-parser' );
const conventionalCommitsFilter = require( 'conventional-commits-filter' );
const gitRawCommits = require( 'git-raw-commits' );
const concat = require( 'concat-stream' );
const { stream } = require( '@ckeditor/ckeditor5-dev-utils' );
const parserOptions = require( './transform-commit/parser-options' );
const { availableCommitTypes } = require( './transform-commit/transform-commit-utils' );
const getPackageJson = require( './getpackagejson' );

const REGEXP = /(?:Feature|Other|Fix) \([\w\-, ]+?\):/g;

/**
 * Returns a type (major, minor, patch) of the next release based on commits.
 *
 * If given package has not changed, suggested version will be equal to 'skip'.
 *
 * It returns a promise that resolves to the `releaseType` and all `commits` that have been checked.
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
					.reduce( ( allCommits, commit ) => {
						if ( Array.isArray( commit ) ) {
							allCommits.push( ...commit );
						} else {
							allCommits.push( commit );
						}

						return allCommits;
					}, [] )
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
	// @param {Object} options
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
		let minorBreakingChanges = false;

		for ( const commit of publicCommits ) {
			for ( const note of commit.notes ) {
				if ( note.title === 'MAJOR BREAKING CHANGES' ) {
					return 'major';
				}

				if ( note.title === 'MINOR BREAKING CHANGES' ) {
					minorBreakingChanges = true;
				}
			}

			if ( commit.rawType === 'Feature' ) {
				newFeatures = true;
			}
		}

		// Repository has new features or minor breaking changes.
		if ( minorBreakingChanges || newFeatures ) {
			return 'minor';
		}

		return 'patch';
	}
};
