/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const conventionalCommitsParser = require( 'conventional-commits-parser' );
const conventionalCommitsFilter = require( 'conventional-commits-filter' );
const gitRawCommits = require( 'git-raw-commits' );
const concat = require( 'concat-stream' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parserOptions = require( './transform-commit/parser-options' );
const { availableCommitTypes } = require( './transform-commit/transform-commit-utils' );
const getPackageJson = require( './getpackagejson' );
const utils = require( './transform-commit/transform-commit-utils' );

module.exports = getNewReleaseType;

// Used for testing purposes.
getNewReleaseType._displayCommits = _displayCommits;

// A size of indent for a log. The number is equal to length of the log string:
// '* 1234567 ', where '1234567' is a short commit id.
const INDENT_SIZE = 10;

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
function getNewReleaseType( transformCommit, options = {} ) {
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

				getNewReleaseType._displayCommits( commits );

				return resolve( { releaseType: _getNewVersionType( commits ) } );
			} ) );
	} );
}

// Returns a type of version for a release based on the commits.
//
// @param {Array.<Commit>} commits
// @returns {String}
function _getNewVersionType( commits ) {
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

// Displays all commits on the console.
//
// @param {Array.<Commit>} commits
function _displayCommits( commits ) {
	const log = logger();

	for ( const singleCommit of commits ) {
		const hasCorrectType = utils.availableCommitTypes.has( singleCommit.rawType );
		const isCommitIncluded = utils.availableCommitTypes.get( singleCommit.rawType );

		let logMessage = `* ${ chalk.yellow( singleCommit.hash ) } "${ utils.truncate( singleCommit.header, 100 ) }" `;

		if ( hasCorrectType && isCommitIncluded ) {
			logMessage += chalk.green( 'INCLUDED' );
		} else if ( hasCorrectType && !isCommitIncluded ) {
			logMessage += chalk.grey( 'SKIPPED' );
		} else {
			logMessage += chalk.red( 'INVALID' );
		}

		// Avoid displaying singleCommit merge twice.
		if ( singleCommit.merge && singleCommit.merge !== singleCommit.header ) {
			logMessage += `\n${ ' '.repeat( INDENT_SIZE ) }${ chalk.italic( singleCommit.merge ) }`;
		}

		log.info( logMessage );
	}
}
