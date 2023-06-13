/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

/**
 * Creates an AbortController instance and register the callback on SIGINT event that aborts the asynchronous process.
 *
 * @returns {AbortController}
 */
function registerAbortController() {
	const abortController = new AbortController();

	const callback = () => {
		abortController.abort( 'SIGINT' );
	};

	abortController._callback = callback;

	process.on( 'SIGINT', abortController._callback );

	return abortController;
}

/**
 * Deregisters the previously registered callback on SIGINT event from the given AbortController.
 *
 * @param {AbortController} abortController
 */
function deregisterAbortController( abortController ) {
	if ( !abortController || !abortController._callback ) {
		return;
	}

	process.off( 'SIGINT', abortController._callback );
}

module.exports = {
	registerAbortController,
	deregisterAbortController
};
