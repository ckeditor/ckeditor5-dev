/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
 * A factory function that creates an instance of a CLI spinner. It supports both a spinner CLI and a spinner with a counter.
 *
 * The spinner improves UX when processing a time-consuming task. A developer does not have to consider whether the process hanged on.
 *
 * @param {String} title Description of the current processed task.
 * @param {Object} [options={}]
 * @param {Boolean} [options.isDisabled] Whether the spinner should be disabled.
 * @param {String} [options.emoji='📍'] An emoji that will replace the spinner when it finishes.
 * @param {Number} [options.indentLevel=1] The indent level.
 * @param {Number} [options.total] If specified, the spinner contains a counter. It starts from `0`. To increase its value,
 * call the `#increase()` method on the returned instance of the spinner.
 * @param {String|CKEditor5SpinnerStatus} [options.status='[title] Status: [current]/[total].'] If a spinner is a counter,
 * this option allows customizing the displayed line.
 * @returns {CKEditor5Spinner}
 */
module.exports = function createSpinner( title, options = {} ) {
	const isEnabled = !options.isDisabled && isInteractive();
	const indentLevel = options.indentLevel || 0;
	const indent = ' '.repeat( indentLevel * INDENT_SIZE );
	const emoji = options.emoji || '📍';
	const status = options.status || '[title] Status: [current]/[total].';
	const spinnerType = typeof options.total === 'number' ? 'counter' : 'spinner';

	let timerId;
	let counter = 0;

	return {
		start() {
			if ( !isEnabled ) {
				console.log( `${ emoji } ${ title }` );
				return;
			}

			const { frames } = cliSpinners.dots12;
			const getMessage = () => {
				if ( spinnerType === 'spinner' ) {
					return title;
				}

				if ( typeof options.status === 'function' ) {
					return options.status( title, counter, options.total );
				}

				return `${ status }`
					.replace( '[title]', title )
					.replace( '[current]', counter )
					.replace( '[total]', options.total.toString() );
			};

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

				process.stdout.write( `${ indent }${ frames[ index++ ] } ${ getMessage() }` );
				shouldClearLastLine = true;
			}, cliSpinners.dots12.interval );
		},

		increase() {
			if ( spinnerType === 'spinner' ) {
				throw new Error( 'The \'#increase()\' method is available only when using the counter spinner.' );
			}

			counter += 1;
		},

		finish( options = {} ) {
			const finishEmoji = options.emoji || emoji;

			if ( !isEnabled ) {
				return;
			}

			clearInterval( timerId );
			clearLastLine();

			if ( spinnerType === 'counter' ) {
				clearLastLine();
			}

			cliCursor.show();
			console.log( `${ indent }${ finishEmoji } ${ title }` );
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
 * @property {CKEditor5SpinnerStart} start
 *
 * @property {CKEditor5SpinnerIncrease} increase
 *
 * @property {CKEditor5SpinnerFinish} finish
 */

/**
 * @callback CKEditor5SpinnerStart
 */

/**
 * @callback CKEditor5SpinnerIncrease
 */

/**
 * @callback CKEditor5SpinnerFinish
 *
 * @param {Object} [options={}]
 *
 * @param {String} [options.emoji]
 */

/**
 * @callback CKEditor5SpinnerStatus
 *
 * @param {String} title
 *
 * @param {Number} current
 *
 * @param {Number} total
 */
