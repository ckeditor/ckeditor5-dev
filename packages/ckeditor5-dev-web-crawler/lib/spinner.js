#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import chalk from 'chalk';
import ora from 'ora';

/**
 * Creates nice-looking CLI spinner.
 * @param {object} options
 * @param {boolean} [options.noSpinner=false] Whether to display the spinner with progress or a message with current progress.
 */
export function createSpinner( { noSpinner } ) {
	return ora( {
		spinner: {
			frames: [ '⣾', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽' ]
		},
		// Do not render the spinner if the `verbose` mode is enabled.
		isSilent: noSpinner,
		stream: noSpinner ? process.stdout : process.stderr
	} );
}

/**
 * Returns a progress handler, which is called every time just before opening a new link.
 *
 * @param {object} spinner Spinner instance
 * @param {object} options
 * @param {boolean} [options.verbose] Whether to display raw log instead of modifying the spinner instance.
 * @returns {Function} Progress handler.
 */
export function getProgressHandler( spinner, { verbose } ) {
	let current = 0;

	return ( { total } ) => {
		current++;

		const progress = Math.round( current / total * 100 );
		const logMessage = `Checking pages… ${ chalk.bold( `${ progress }% (${ current } of ${ total })` ) }`;

		if ( verbose ) {
			console.log( logMessage );
		} else {
			spinner.text = logMessage;
		}
	};
}
