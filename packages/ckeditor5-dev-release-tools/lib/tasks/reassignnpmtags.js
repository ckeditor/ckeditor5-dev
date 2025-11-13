#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import { styleText, promisify } from 'util';
import columns from 'cli-columns';
import shellEscape from 'shell-escape';
import assertNpmAuthorization from '../utils/assertnpmauthorization.js';
import { exec } from 'child_process';

const execPromise = promisify( exec );

/**
 * Used to switch the tags from `staging` to `latest` for specified array of packages.
 * Each operation will be retried up to 3 times in case of failure.
 *
 * @param {object} options
 * @param {string} options.npmOwner User that is authorized to release packages.
 * @param {string} options.version Specifies the version of packages to reassign the tags for.
 * @param {Array.<string>} options.packages Array of packages' names to reassign tags for.
 * @param {string} [options.npmTag='latest'] Npm dist-tag to assign.
 * @returns {Promise}
 */
export default async function reassignNpmTags( options ) {
	const {
		npmOwner,
		version,
		packages,
		npmTag = 'latest'
	} = options;

	const errors = [];
	const packagesSkipped = [];
	const packagesUpdated = [];

	await assertNpmAuthorization( npmOwner );

	const counter = tools.createSpinner( 'Reassigning npm tags...', { total: packages.length } );
	counter.start();

	const updateTagPromises = packages.map( async packageName => {
		const command = `npm dist-tag add ${ shellEscape( [ packageName ] ) }@${ shellEscape( [ version ] ) } ${ npmTag }`;
		const updateLatestTagRetryable = retry( () => execPromise( command ) );
		await updateLatestTagRetryable()
			.then( response => {
				if ( response.stdout ) {
					packagesUpdated.push( packageName );
				} else if ( response.stderr ) {
					throw new Error( response.stderr );
				}
			} )
			.catch( error => {
				if ( error.message.includes( 'is already set to version' ) ) {
					packagesSkipped.push( packageName );
				} else {
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
		console.log( styleText( [ 'green', 'bold' ], '✨ Tags updated:' ) );
		console.log( columns( packagesUpdated ) );
	}

	if ( packagesSkipped.length ) {
		console.log( styleText( [ 'yellow', 'bold' ], '⬇️ Packages skipped:' ) );
		console.log( columns( packagesSkipped ) );
	}

	if ( errors.length ) {
		console.log( styleText( [ 'red', 'bold' ], '🐛 Errors found:' ) );
		errors.forEach( msg => console.log( `* ${ msg }` ) );
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
