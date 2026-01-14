/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Creates an AbortController instance and registers the listener function on SIGINT event that aborts the asynchronous process.
 *
 * @returns {AbortController}
 */
export function registerAbortController() {
	const abortController = new AbortController();

	const listener = () => {
		abortController.abort( 'SIGINT' );
	};

	abortController._listener = listener;

	// Add the listener function to the beginning of the listeners array for the SIGINT event. Listr2 has own SIGINT listener that
	// terminates the process, so in order to abort our asynchronous workers, our listener must be executed first.
	process.prependOnceListener( 'SIGINT', abortController._listener );

	return abortController;
}

/**
 * Deregisters the previously registered listener function on SIGINT event from the given AbortController instance.
 *
 * @param {AbortController} abortController
 */
export function deregisterAbortController( abortController = undefined ) {
	if ( !abortController || !abortController._listener ) {
		return;
	}

	process.removeListener( 'SIGINT', abortController._listener );
}
