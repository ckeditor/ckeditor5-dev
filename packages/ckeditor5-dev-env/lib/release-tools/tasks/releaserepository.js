/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const versionUtils = require( '../utils/versions' );
const cli = require( '../utils/cli' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const { getChangesForVersion } = require( '../utils/changelog' );
const releaseRepositoryUtil = require( '../utils/releaserepository' );
const validatePackageToRelease = require( '../utils/validatepackagetorelease' );

/**
 * Releases the package defined in the current work directory.
 *
 * This task does not required any params because it will be passed by the user during the process.
 *
 * @returns {Promise}
 */
module.exports = function releaseRepository() {
	const gitVersion = versionUtils.getLastTagFromGit();
	const changelogVersion = versionUtils.getLastFromChangelog();

	if ( gitVersion === changelogVersion ) {
		return reject( 'Before starting the release process, you should generate the changelog.' );
	}

	const releaseTaskOptions = {
		version: changelogVersion,
		changes: getChangesForVersion( changelogVersion )
	};

	const errors = validatePackageToRelease( releaseTaskOptions );

	if ( errors.length ) {
		const log = logger();

		log.error( 'Unexpected errors occured:' );
		errors.map( err => '* ' + err ).forEach( log.error.bind( log ) );

		return reject( 'Releasing has been aborted due to errors.' );
	}

	return cli.configureReleaseOptions()
		.then( userOptions => {
			const options = Object.assign( {}, releaseTaskOptions, userOptions );

			return releaseRepositoryUtil( options );
		} );
};

function reject( message ) {
	return Promise.reject( new Error( message ) );
}
