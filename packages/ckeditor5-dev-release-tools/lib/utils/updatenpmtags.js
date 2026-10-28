/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import { styleText, promisify } from 'node:util';
import columns from 'cli-columns';
import assertNpmAuthorization from './assertnpmauthorization.js';
import getNpmIdToken from './getnpmidtoken.js';
import { exec } from 'node:child_process';

const execPromise = promisify( exec );

/**
 * Runs an `npm dist-tag` command for each package in parallel. The common part of `reassignNpmTags()` and `removeNpmTags()`.
 *
 * Each command is retried up to 3 times in case of failure. A package is reported as skipped when npm answers that
 * nothing needs to change for it. When the command failed for at least one package, the returned promise rejects
 * after all packages have been processed, so the caller does not treat a partial update as a success.
 *
 * @param {object} options
 * @param {string} [options.npmOwner] User that is authorized to release packages. Required unless `useOidc` is enabled.
 * @param {boolean} [options.useOidc=false] Whether to authorize using npm Trusted Publishing (OIDC).
 * @param {Array.<string>} options.packages Names of the packages to process.
 * @param {function(string):string} options.getCommand Returns the `npm dist-tag` command for a package name.
 * @param {Array.<string>} options.skipMessages Parts of npm error messages meaning that nothing needs to change for the package.
 * @param {string} options.spinnerTitle
 * @param {string} options.updatedTitle A title of the list of packages that the command changed.
 * @param {string} options.errorMessage The start of the error message. The names of the failed packages are appended to it.
 * @returns {Promise} Rejects when the command failed for at least one package.
 */
export default async function updateNpmTags( options ) {
	const {
		npmOwner,
		useOidc = false,
		packages,
		getCommand,
		skipMessages,
		spinnerTitle,
		updatedTitle,
		errorMessage
	} = options;

	const errors = [];
	const packagesFailed = [];
	const packagesSkipped = [];
	const packagesUpdated = [];

	await assertNpmAuthorization( npmOwner, { useOidc } );

	const counter = tools.createSpinner( spinnerTitle, { total: packages.length } );
	counter.start();

	const updateTagPromises = packages.map( async packageName => {
		const command = getCommand( packageName );
		const updateTagRetryable = retry( async () => {
			if ( !useOidc ) {
				return execPromise( command );
			}

			// The calls run in parallel, so the fresh token is passed only to this npm process.
			return execPromise( command, { env: { ...process.env, NPM_ID_TOKEN: await getNpmIdToken() } } );
		} );
		await updateTagRetryable()
			.then( response => {
				if ( response.stdout ) {
					packagesUpdated.push( packageName );
				} else if ( response.stderr ) {
					throw new Error( response.stderr );
				}
			} )
			.catch( error => {
				if ( skipMessages.some( message => error.message.includes( message ) ) ) {
					packagesSkipped.push( packageName );
				} else {
					packagesFailed.push( packageName );
					errors.push( trimErrorMessage( error.message ) );
				}
			} )
			.finally( () => {
				counter.increase();
			} );
	} );

	await Promise.allSettled( updateTagPromises );

	counter.finish();

	if ( packagesUpdated.length ) {
		console.log( styleText( [ 'green', 'bold' ], updatedTitle ) );
		console.log( columns( packagesUpdated ) );
	}

	if ( packagesSkipped.length ) {
		console.log( styleText( [ 'yellow', 'bold' ], '⬇️ Packages skipped:' ) );
		console.log( columns( packagesSkipped ) );
	}

	if ( errors.length ) {
		console.log( styleText( [ 'red', 'bold' ], '🐛 Errors found:' ) );
		errors.forEach( msg => console.log( `* ${ msg }` ) );

		throw new Error( errorMessage + packagesFailed.join( ', ' ) + '.' );
	}
}

/**
 * @param {string} message
 * @returns {string}
 */
function trimErrorMessage( message ) {
	return message.replace( /npm ERR!.*\n/g, '' ).trim();
}

/**
 * @param {function} callback
 * @param {number} times
 * @returns {RetryCallback}
 */
function retry( callback, times = 3 ) {
	return ( ...args ) => Promise.resolve()
		.then( () => callback( ...args ) )
		.catch( err => {
			if ( times > 0 ) {
				return retry( callback, times - 1 )( ...args );
			}

			throw err;
		} );
}

/**
 * @callback RetryCallback
 * @param {...*} args
 * @returns {Promise}
 */
