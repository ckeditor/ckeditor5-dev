#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* eslint-env node */

const chalk = require( 'chalk' );
const ora = require( 'ora' );

/**
 * Creates nice-looking CLI spinner.
 * @param {Object} options
 * @param {Boolean} [options.noSpinner=false] Whether to display the spinner with progress or a message with current progress.
 */
function createSpinner( { noSpinner } ) {
	return ora( {
		spinner: {
			frames: [ '⣾', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽' ]
		},
		stream: noSpinner ? process.stdout : process.stderr
	} );
}

/**
 * Returns a progress handler, which is called every time just before opening a new link.
 *
 * @param {Object} spinner Spinner instance
 * @param {Object} options
 * @param {Boolean} [options.verbose] Whether to display raw log instead of modifying the spinner instance.
 * @returns {Function} Progress handler.
 */
function getProgressHandler( spinner, { verbose } ) {
	let current = 0;

	// Do not render the spinner if the `verbose` mode is enabled.
	if ( verbose ) {
		spinner.isSilent = true;
	}

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

module.exports = {
	createSpinner,
	getProgressHandler
};
