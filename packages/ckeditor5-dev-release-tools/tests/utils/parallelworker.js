/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import { parentPort } from 'worker_threads';
import virtual from 'virtual:parallelworker-integration-module';

const taskOptions = vi.hoisted( () => ( {
	aNumber: 1,
	bBoolean: false,
	cString: 'foo'
} ) );

vi.mock( 'virtual:parallelworker-integration-module' );
vi.mock( 'worker_threads', () => ( {
	parentPort: {
		postMessage: vi.fn()
	},
	workerData: {
		callbackModule: 'virtual:parallelworker-integration-module',
		packages: [
			'/home/ckeditor/packages/a',
			'/home/ckeditor/packages/b'
		],
		taskOptions
	}
} ) );

describe( 'parallelWorker (worker defined in executeInParallel())', () => {
	it( 'should execute a module from specified path and pass a package path and task options as arguments', async () => {
		await import( '../../lib/utils/parallelworker.js' );

		// It's needed because `parallelworker` does not export anything. Instead, it processes
		// an asynchronous loop. We must wait until the current JavaScript loop ends. Adding a new promise at the end
		// forces it.
		await new Promise( resolve => {
			setTimeout( resolve, 0 );
		} );

		expect( vi.mocked( parentPort ).postMessage ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( parentPort ).postMessage ).toHaveBeenCalledWith( 'done:package' );
		expect( vi.mocked( virtual ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( virtual ) ).toHaveBeenCalledWith( '/home/ckeditor/packages/a', taskOptions );
		expect( vi.mocked( virtual ) ).toHaveBeenCalledWith( '/home/ckeditor/packages/b', taskOptions );
	} );
} );
