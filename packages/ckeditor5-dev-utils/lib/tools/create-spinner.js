/**
 * @license Copyright (c) 2020-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const readline = require( 'readline' );
const isInteractive = require( 'is-interactive' );
const cliSpinners = require( 'cli-spinners' );
const cliCursor = require( 'cli-cursor' );

// A size of default indent for a log.
const INDENT_SIZE = 3;

/**
 * A factory function that creates an instance of a CLI spinner.
 *
 * The spinner improves UX when processing a time-consuming task.
 * A developer does not have to consider whether the process hanged on.
 *
 * @param {String} title Description of the current processed task.
 * @param {Object} [options={}]
 * @param {Boolean} [options.isDisabled] Whether the spinner should be disabled.
 * @param {Number} [options.indentLevel=1] The indent level.
 * @return {CKEditor5Spinner}
 */
module.exports = function createSpinner( title, options = {} ) {
	const isEnabled = !options.isDisabled && isInteractive();
	const indentLevel = options.indentLevel || 0;
	const indent = ' '.repeat( indentLevel * INDENT_SIZE );

	let timerId;

	return {
		start() {
			if ( !isEnabled ) {
				console.log( `📍 ${ title }` );
				return;
			}

			const frames = cliSpinners.dots12.frames;

			let index = 0;
			let shouldClearLastLine = false;

			cliCursor.hide();

			timerId = setInterval( () => {
				if ( index === frames.length ) {
					index = 0;
				}

				if ( shouldClearLastLine ) {
					clearLastLine();
				}

				process.stdout.write( `${ indent }${ frames[ index++ ] } ${ title }` );
				shouldClearLastLine = true;
			}, cliSpinners.dots12.interval );
		},

		finish() {
			if ( !isEnabled ) {
				return;
			}

			clearInterval( timerId );
			clearLastLine();

			cliCursor.show();
			console.log( `${ indent }📍 ${ title }` );
		}
	};

	function clearLastLine() {
		readline.clearLine( process.stdout, 1 );
		readline.cursorTo( process.stdout, 0 );
	}
};

/**
 * @typedef {Object} CKEditor5Spinner
 *
 * @property {Function} start
 *
 * @property {Function} finish
 */
