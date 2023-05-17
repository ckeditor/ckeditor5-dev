#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Used to switch the tags from `staging` to `latest` for specified array of packages.
 *
 * @param {Object} options
 * @param {String} options.authorizedUser User that is authorized to release packages.
 * @param {String} options.version Specifies the version of packages to reassign the tags for.
 * @param {Array.<String>} options.packages Array of packages' names to reassign tags for.
 * @returns {Promise}
 */
module.exports = async function reassignNpmTags( { authorizedUser, version, packages } ) {
	const errors = [];
	const packagesSkipped = [];
	const packagesUpdated = [];

	await verifyLoggedInUserIsAuthorizedToPublish( authorizedUser );

	for ( const packageName of packages ) {
		try {
			const latestVersion = await exec( `npm show ${ packageName }@latest version` );

			if ( latestVersion === version ) {
				packagesSkipped.push( `${ packageName }@${ version }` );

				continue;
			}

			await exec( `npm dist-tag add ${ packageName }@${ version } latest` );
			packagesUpdated.push( `${ packageName }@${ version }` );
		} catch ( e ) {
			errors.push( trimErrorMessage( e.message ) );
		}
	}

	if ( packagesUpdated.length ) {
		console.log( 'Tags updated for:\n' + packagesUpdated.join( '\n' ) );
	}

	if ( packagesSkipped.length ) {
		console.log( 'Packages skipped:\n' + packagesSkipped.join( '\n' ) );
	}

	if ( errors.length ) {
		console.log( 'Errors found:\n' + errors.join( '\n' ) );
	}
};

/**
 * @param {String} authorizedUser
 * @returns {Promise}
 */
async function verifyLoggedInUserIsAuthorizedToPublish( authorizedUser ) {
	const loggedInUser = ( await exec( 'npm whoami' ) ).trim();

	if ( loggedInUser !== authorizedUser ) {
		throw new Error( `User: ${ loggedInUser } is not matching authorized user: ${ authorizedUser }.` );
	}
}

/**
 * @param {String} message
 * @returns {String}
 */
function trimErrorMessage( message ) {
	return message.replace( /npm ERR!.*\n/g, '' ).trim();
}

/**
 * @param {String} command
 * @returns {Promise.<String>}
 */
async function exec( command ) {
	return tools.shExec( command, { verbosity: 'error', async: true } );
}
