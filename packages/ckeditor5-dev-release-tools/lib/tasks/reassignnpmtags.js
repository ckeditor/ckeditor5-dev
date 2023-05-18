#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const chalk = require( 'chalk' );
const columns = require( 'cli-columns' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Used to switch the tags from `staging` to `latest` for specified array of packages.
 *
 * @param {Object} options
 * @param {String} options.npmOwner User that is authorized to release packages.
 * @param {String} options.version Specifies the version of packages to reassign the tags for.
 * @param {Array.<String>} options.packages Array of packages' names to reassign tags for.
 * @returns {Promise}
 */
module.exports = async function reassignNpmTags( { npmOwner, version, packages } ) {
	const errors = [];
	const packagesSkipped = [];
	const packagesUpdated = [];

	await verifyLoggedInUserIsAuthorizedToPublish( npmOwner );

	const counter = tools.createSpinner( 'Reassigning npm tags...', { total: packages.length } );
	counter.start();

	for ( const packageName of packages ) {
		try {
			// TODO: Handle NPMERR 404.
			const latestVersion = ( await exec( `npm show ${ packageName }@latest version` ) ).trim();

			if ( latestVersion === version ) {
				packagesSkipped.push( packageName );

				continue;
			}

			await exec( `npm dist-tag add ${ packageName }@${ version } latest` );
			packagesUpdated.push( packageName );
		} catch ( e ) {
			errors.push( trimErrorMessage( e.message ) );
		} finally {
			counter.increase();
		}
	}

	counter.finish();

	if ( packagesUpdated.length ) {
		console.log( chalk.bold.green( '✨ Tags updated:' ) );
		console.log( columns( packagesUpdated ) );
	}

	if ( packagesSkipped.length ) {
		console.log( chalk.bold.yellow( '⬇️ Packages skipped:' ) );
		console.log( columns( packagesSkipped ) );
	}

	if ( errors.length ) {
		console.log( chalk.bold.red( '🐛 Errors found:' ) );
		errors.forEach( msg => console.log( `* ${ msg }` ) );
	}
};

/**
 * @param {String} npmOwner
 * @returns {Promise}
 */
async function verifyLoggedInUserIsAuthorizedToPublish( npmOwner ) {
	const loggedInUser = ( await exec( 'npm whoami' ) ).trim();

	if ( loggedInUser !== npmOwner ) {
		throw new Error( `User: ${ loggedInUser } is not matching authorized user: ${ npmOwner }.` );
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
