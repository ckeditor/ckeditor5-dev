/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// This file is covered by the "executeInParallel() - integration" test cases.

import { parentPort, workerData } from 'node:worker_threads';

// Required due to top-level await.
( async () => {
	/**
	 * @param {string} callbackModule
	 * @param {Array.<string>} packages
	 */
	const { default: callback } = await import( workerData.callbackModule );

	for ( const packagePath of workerData.packages ) {
		await callback( packagePath, workerData.taskOptions );

		// To increase the status log.
		parentPort.postMessage( 'done:package' );
	}
} )();
