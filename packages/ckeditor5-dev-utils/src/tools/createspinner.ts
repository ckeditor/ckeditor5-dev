/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import readline from 'node:readline';
import isInteractive from 'is-interactive';
import cliSpinners from 'cli-spinners';
import cliCursor from 'cli-cursor';

// A size of default indent for a log.
const INDENT_SIZE = 3;

type CreateSpinnerOptions = {

	/**
	 * Whether the spinner should be disabled.
	 */
	isDisabled?: boolean;

	/**
	 * An emoji that will replace the spinner when it finishes.
	 *
	 * @default '📍'
	 */
	emoji?: string;

	/**
	 * The indent level.
	 */
	indentLevel?: number;

	/**
	 * If specified, the spinner contains a counter. It starts from `0`.
	 * To increase its value, call the `#increase()` method on the returned instance of the spinner.
	 */
	total?: number;

	/**
	 * If a spinner is a counter, this option allows customizing the displayed line.
	 *
	 * @default '[title] Status: [current]/[total].'
	 */
	status?: string | CKEditor5SpinnerStatus;
};

type CKEditor5Spinner = {
	start: () => void;
	increase: () => void;
	finish: ( options?: { emoji?: string } ) => void;
};

type CKEditor5SpinnerStatus = ( title: string, current: number, total: number ) => string;

/**
 * A factory function that creates an instance of a CLI spinner. It supports both a spinner CLI and a spinner with a counter.
 *
 * The spinner improves UX when processing a time-consuming task. A developer does not have to consider whether the process hanged on.
 *
 * @param title Description of the current processed task.
 * @param [options={}]
 */
export default function createSpinner( title: string, options: CreateSpinnerOptions = {} ): CKEditor5Spinner {
	const isEnabled = !options.isDisabled && isInteractive();
	const indentLevel = options.indentLevel || 0;
	const indent = ' '.repeat( indentLevel * INDENT_SIZE );
	const emoji = options.emoji || '📍';
	const status = options.status || '[title] Status: [current]/[total].';
	const spinnerType = typeof options.total === 'number' ? 'counter' : 'spinner';

	let timerId: ReturnType<typeof setTimeout>;
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
					return options.status( title, counter, options.total! );
				}

				return `${ status }`
					.replace( '[title]', title )
					.replace( '[current]', String( counter ) )
					.replace( '[total]', options.total!.toString() );
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
}

