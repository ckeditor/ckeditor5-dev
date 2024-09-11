#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import columns from 'cli-columns';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import util from 'util';
import shellEscape from 'shell-escape';
import assertNpmAuthorization from '../utils/assertnpmauthorization.js';
import { exec } from 'child_process';

const execPromise = util.promisify( exec );

/**
 * Used to switch the tags from `staging` to `latest` for specified array of packages.
 * Each operation will be retried up to 3 times in case of failure.
 *
 * @param {Object} options
 * @param {String} options.npmOwner User that is authorized to release packages.
 * @param {String} options.version Specifies the version of packages to reassign the tags for.
 * @param {Array.<String>} options.packages Array of packages' names to reassign tags for.
 * @returns {Promise}
 */
export default async function reassignNpmTags( { npmOwner, version, packages } ) {
	const errors = [];
	const packagesSkipped = [];
	const packagesUpdated = [];

	await assertNpmAuthorization( npmOwner );

	const counter = tools.createSpinner( 'Reassigning npm tags...', { total: packages.length } );
	counter.start();

	const updateTagPromises = packages.map( async packageName => {
		const command = `npm dist-tag add ${ shellEscape( [ packageName ] ) }@${ shellEscape( [ version ] ) } latest`;
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
}

/**
 * @param {String} message
 * @returns {String}
 */
function trimErrorMessage( message ) {
	return message.replace( /npm ERR!.*\n/g, '' ).trim();
}

/**
 * @param {Function} callback
 * @param {Number} times
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
