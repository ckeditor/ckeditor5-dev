/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Proposes new version based on commits.
 *
 * @param {Array.<Commit>} commits
 * @returns {String|null}
 */
module.exports = function getNewVersionType( commits ) {
	// No commits = no changes.
	if ( !commits.length ) {
		return 'skip';
	}

	const publicCommits = commits.filter( commit => commit.isPublicCommit );

	// No public commits = internal changes.
	if ( !publicCommits.length ) {
		return 'internal';
	}

	let newFeatures = false;
	let minorBreakingChanges = false;

	for ( const commit of publicCommits ) {
		for ( const note of commit.notes ) {
			if ( note.title === 'MAJOR BREAKING CHANGES' || note.title === 'BREAKING CHANGES' ) {
				return 'major';
			}

			/* istanbul ignore else */
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
};
