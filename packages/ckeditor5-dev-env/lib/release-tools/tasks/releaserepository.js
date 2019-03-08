/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const versionUtils = require( '../utils/versions' );
const cli = require( '../utils/cli' );
const { tools, logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const { getChangesForVersion } = require( '../utils/changelog' );
const releaseRepositoryUtil = require( '../utils/releaserepository' );
const validatePackageToRelease = require( '../utils/validatepackagetorelease' );

const GENERATE_CHANGELOG = 'Before starting the release process, you should generate the changelog.';
const FAILED_VALIDATION = 'Releasing has been aborted due to errors.';
const AUTH_REQUIRED = 'This command requires you to be logged in.';

const log = logger();

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
		return showWarning( GENERATE_CHANGELOG );
	}

	log.info( 'Checking whether you are logged to npm...' );

	const whoami = authCheck();

	if ( whoami ) {
		log.info( `🔑 Logged as "${ chalk.underline( whoami ) }".` );
	} else {
		return showWarning( AUTH_REQUIRED );
	}

	const releaseTaskOptions = {
		version: changelogVersion,
		changes: getChangesForVersion( changelogVersion )
	};

	const errors = validatePackageToRelease( releaseTaskOptions );

	if ( errors.length ) {
		log.error( 'Unexpected errors occured:' );
		errors.map( err => '* ' + err ).forEach( log.error.bind( log ) );

		return showWarning( FAILED_VALIDATION );
	}

	return cli.configureReleaseOptions()
		.then( userOptions => {
			const options = Object.assign( {}, releaseTaskOptions, userOptions );

			return releaseRepositoryUtil( options );
		} )
		.catch( err => {
			log.error( err.message );

			process.exitCode = -1;
		} );
};

function authCheck() {
	try {
		return exec( 'npm whoami' ).trim();
	} catch ( err ) {
		return false;
	}
}

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}

function showWarning( message ) {
	log.warning( message );

	return Promise.resolve();
}
