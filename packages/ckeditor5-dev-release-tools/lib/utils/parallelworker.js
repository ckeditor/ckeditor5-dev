/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

// This file is covered by the "executeInParallel() - integration" test cases.

// Required due to top-level await.
( async () => {
	/**
	 * @param {String} callbackModule
	 * @param {Array.<String>} packages
	 */
	const { parentPort, workerData } = require( 'worker_threads' );
	const callback = require( workerData.callbackModule );

	for ( const packagePath of workerData.packages ) {
		await callback( packagePath, workerData.taskOptions );

		// To increase the status log.
		parentPort.postMessage( 'done:package' );
	}
} )();
