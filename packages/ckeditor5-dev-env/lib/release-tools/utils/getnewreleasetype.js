/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { commitTypes, transform } = require( '../changelog/writer-options' );

/**
 * Returns a type (major, minor, patch) of the next release based on commits.
 *
 * @returns {Promise}
 */
module.exports = function getNewReleaseType() {
	const conventionalRecommendedBump = require( 'conventional-recommended-bump' );
	const parserOpts = require( '../changelog/parser-options' );

	return new Promise( ( resolve, reject ) => {
		const options = {
			whatBump: getNewVersionType
		};

		conventionalRecommendedBump( options, parserOpts, ( err, response ) => {
			if ( err ) {
				return reject( err );
			}

			return resolve( response );
		} );
	} );
};

// Returns a level which represents a type of release based on the commits.
//   - 0: major,
//   - 1: minor,
//   - 2: patch.
//
// An input array is a result of module https://github.com/conventional-changelog/conventional-commits-parser.
//
// @param {Array} commits
// @returns {Number}
function getNewVersionType( commits ) {
	let hasNewFeatures = false;

	for ( const item of commits ) {
		const singleCommit = transform( item, false );

		if ( !singleCommit ) {
			continue;
		}

		// Check whether the commit is visible in changelog.
		if ( !commitTypes.get( singleCommit.rawType ) ) {
			continue;
		}

		for ( const note of singleCommit.notes ) {
			if ( note.title === 'BREAKING CHANGES' || note.title === 'BREAKING CHANGE' ) {
				return 0;
			}
		}

		if ( !hasNewFeatures && singleCommit.rawType === 'Feature' ) {
			hasNewFeatures = true;
		}
	}

	return hasNewFeatures ? 1 : 2;
}
