/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';

/**
 * @param {object} options
 * @param {string|null} options.version Version of the current release.
 * @param {string} options.changes Changelog entries for the current release.
 * @param {boolean} [options.ignoreBranchCheck=false] If set on true, branch checking will be skipped.
 * @param {string} [options.branch='master'] A name of the branch that should be used for releasing packages.
 * @returns {Promise.<Array.<string>>}
 */
export default async function validateRepositoryToRelease( options ) {
	const {
		version,
		changes,
		ignoreBranchCheck = false,
		branch = 'master'
	} = options;
	const errors = [];

	// Check whether the repository is ready for the release.
	const status = ( await exec( 'git status -sb' ) ).trim();

	if ( !ignoreBranchCheck ) {
		// Check whether current branch is "master".
		if ( !status.startsWith( `## ${ branch }` ) ) {
			errors.push( `Not on the "#${ branch }" branch.` );
		}
	}

	// Check whether the local branch is sync with the remote.
	if ( status.match( /behind \d+/ ) ) {
		errors.push( 'The branch is behind with the remote.' );
	}

	// Check whether specified the version.
	if ( !options.version ) {
		errors.push( `Passed an invalid version ("${ options.version }").` );

		return errors;
	}

	// Check whether the changelog entries are correct.
	if ( !changes ) {
		errors.push( `Cannot find changelog entries for version "${ version }".` );
	}

	return errors;

	async function exec( command ) {
		return tools.shExec( command, { verbosity: 'error', async: true } );
	}
}
