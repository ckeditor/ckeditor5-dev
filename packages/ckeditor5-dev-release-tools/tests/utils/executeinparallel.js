/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import os from 'os';
import fs from 'fs/promises';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { registerAbortController, deregisterAbortController } from '../../lib/utils/abortcontroller.js';
import executeInParallel from '../../lib/utils/executeinparallel.js';

const stubs = vi.hoisted( () => ( {
	WorkerMock: class {
		constructor( script, options ) {
			// Define a static property that keeps all instances for a particular test scenario.
			if ( !this.constructor.instances ) {
				this.constructor.instances = [];
			}

			this.constructor.instances.push( this );

			this.workerData = options.workerData;
			this.on = vi.fn();
			this.terminate = vi.fn();

			expect( script.toString().endsWith( 'parallelworker.js' ) ).toEqual( true );
		}
	}
} ) );

vi.mock( 'worker_threads', () => ( {
	Worker: stubs.WorkerMock
} ) );

vi.mock( 'os', () => ( {
	default: {
		cpus: vi.fn( () => new Array( 4 ) )
	}
} ) );

vi.mock( 'crypto', () => ( {
	default: {
		randomUUID: vi.fn( () => 'uuid-4' )
	}
} ) );

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'fs/promises' );
vi.mock( '../../lib/utils/abortcontroller.js' );

describe( 'executeInParallel()', () => {
	let abortController, defaultOptions, outputHistory;

	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );

		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [
			'/home/ckeditor/my-packages/package-01',
			'/home/ckeditor/my-packages/package-02',
			'/home/ckeditor/my-packages/package-03',
			'/home/ckeditor/my-packages/package-04'
		] );

		outputHistory = [];

		abortController = new AbortController();

		defaultOptions = {
			packagesDirectory: 'my-packages',
			taskToExecute: packagePath => console.log( 'pwd', packagePath ),
			signal: abortController.signal,
			listrTask: {
				set output( value ) {
					outputHistory.push( value );
				}
			}
		};
	} );

	afterEach( () => {
		// Since the mock is shared across all tests, reset static property that keeps all created instances.
		stubs.WorkerMock.instances = [];
	} );

	it( 'should execute the specified `taskToExecute` on all packages found in the `packagesDirectory`', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		// By default the helper uses a half of available CPUs.
		expect( stubs.WorkerMock.instances ).toHaveLength( 2 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			'/home/ckeditor',
			'my-packages',
			expect.any( Object )
		);

		expect( fs.writeFile ).toHaveBeenCalledTimes( 1 );
		expect( fs.writeFile ).toHaveBeenCalledWith(
			'/home/ckeditor/uuid-4.mjs',
			'export default packagePath => console.log( \'pwd\', packagePath );',
			'utf-8'
		);
		expect( firstWorker.workerData ).toBeInstanceOf( Object );
		expect( firstWorker.workerData ).toHaveProperty( 'callbackModule', 'file:///home/ckeditor/uuid-4.mjs' );
		expect( firstWorker.workerData ).toHaveProperty( 'packages' );

		expect( secondWorker.workerData ).toBeInstanceOf( Object );
		expect( secondWorker.workerData ).toHaveProperty( 'callbackModule', 'file:///home/ckeditor/uuid-4.mjs' );
		expect( secondWorker.workerData ).toHaveProperty( 'packages' );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should execute the specified `taskToExecute` on packages found in the `packagesDirectory` that are not filtered', async () => {
		vi.mocked( workspaces.findPathsToPackages ).mockResolvedValue( [
			'/home/ckeditor/my-packages/package-01',
			'/home/ckeditor/my-packages/package-03',
			'/home/ckeditor/my-packages/package-04'
		] );

		const packagesDirectoryFilter = vi.fn();
		const options = Object.assign( {}, defaultOptions, { packagesDirectoryFilter } );
		const promise = executeInParallel( options );
		await delay( 0 );

		// By default the helper uses a half of available CPUs.
		expect( stubs.WorkerMock.instances ).toHaveLength( 2 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			'/home/ckeditor',
			'my-packages',
			expect.objectContaining( { packagesDirectoryFilter } )
		);

		expect( firstWorker.workerData.packages ).toEqual( [
			'/home/ckeditor/my-packages/package-01',
			'/home/ckeditor/my-packages/package-04'
		] );

		expect( secondWorker.workerData.packages ).toEqual( [
			'/home/ckeditor/my-packages/package-03'
		] );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should use the specified `cwd` when looking for packages', async () => {
		const options = Object.assign( {}, defaultOptions, {
			cwd: '/custom/cwd'
		} );

		const promise = executeInParallel( options );
		await delay( 0 );

		expect( vi.mocked( workspaces.findPathsToPackages ) ).toHaveBeenCalledExactlyOnceWith(
			'/custom/cwd',
			'my-packages',
			expect.any( Object )
		);

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should pass task options to all workers', async () => {
		const taskOptions = {
			property: 'Example of the property.',
			some: {
				deeply: {
					nested: {
						property: 'Example the deeply nested property.'
					}
				}
			}
		};

		const options = Object.assign( {}, defaultOptions, { taskOptions } );

		const promise = executeInParallel( options );
		await delay( 0 );

		// By default the helper uses a half of available CPUs.
		expect( stubs.WorkerMock.instances ).toHaveLength( 2 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		expect( firstWorker.workerData ).toBeInstanceOf( Object );
		expect( firstWorker.workerData ).toHaveProperty( 'taskOptions', taskOptions );

		expect( secondWorker.workerData ).toBeInstanceOf( Object );
		expect( secondWorker.workerData ).toHaveProperty( 'taskOptions', taskOptions );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should create the temporary module properly when using Windows-style paths', async () => {
		process.cwd.mockReturnValue( 'C:\\Users\\ckeditor' );

		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		expect( fs.writeFile ).toHaveBeenCalledTimes( 1 );
		expect( fs.writeFile ).toHaveBeenCalledWith(
			'C:/Users/ckeditor/uuid-4.mjs',
			'export default packagePath => console.log( \'pwd\', packagePath );',
			'utf-8'
		);

		// By default the helper uses a half of available CPUs.
		expect( stubs.WorkerMock.instances ).toHaveLength( 2 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		expect( firstWorker.workerData ).toBeInstanceOf( Object );
		expect( firstWorker.workerData ).toHaveProperty( 'callbackModule', 'file://C:/Users/ckeditor/uuid-4.mjs' );
		expect( firstWorker.workerData ).toHaveProperty( 'packages' );

		expect( secondWorker.workerData ).toBeInstanceOf( Object );
		expect( secondWorker.workerData ).toHaveProperty( 'callbackModule', 'file://C:/Users/ckeditor/uuid-4.mjs' );
		expect( secondWorker.workerData ).toHaveProperty( 'packages' );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should use the specified number of threads (`concurrency`)', async () => {
		const options = Object.assign( {}, defaultOptions, {
			concurrency: 4
		} );

		const promise = executeInParallel( options );
		await delay( 0 );

		expect( stubs.WorkerMock.instances ).toHaveLength( 4 );

		// Workers did not emit an error.
		for ( const worker of stubs.WorkerMock.instances ) {
			getExitCallback( worker )( 0 );
		}

		await promise;
	} );

	it( 'should use number of cores divided by two as default (`concurrency`)', async () => {
		vi.mocked( os.cpus ).mockReturnValue( new Array( 7 ) );

		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		expect( stubs.WorkerMock.instances ).toHaveLength( 3 );

		// Workers did not emit an error.
		for ( const worker of stubs.WorkerMock.instances ) {
			getExitCallback( worker )( 0 );
		}

		await promise;
	} );

	it( 'should round down to the closest integer (`concurrency`)', async () => {
		const options = Object.assign( {}, defaultOptions, {
			concurrency: 3.5
		} );

		const promise = executeInParallel( options );
		await delay( 0 );

		expect( stubs.WorkerMock.instances ).toHaveLength( 3 );

		// Workers did not emit an error.
		for ( const worker of stubs.WorkerMock.instances ) {
			getExitCallback( worker )( 0 );
		}

		await promise;
	} );

	it( 'should assign at least one thread even if concurrency is 0 (`concurrency`)', async () => {
		const options = Object.assign( {}, defaultOptions, {
			concurrency: 0
		} );

		const promise = executeInParallel( options );
		await delay( 0 );

		expect( stubs.WorkerMock.instances ).toHaveLength( 1 );

		// Workers did not emit an error.
		for ( const worker of stubs.WorkerMock.instances ) {
			getExitCallback( worker )( 0 );
		}

		await promise;
	} );

	it( 'should resolve the promise if a worker finished (aborted) with a non-zero exit code (first worker)', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		getExitCallback( firstWorker )( 1 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should resolve the promise if a worker finished (aborted) with a non-zero exit code (second worker)', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 1 );

		await promise;
	} );

	it( 'should reject the promise if a worker emitted an error (first worker)', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;
		const error = new Error( 'Example error from a worker.' );

		getErrorCallback( firstWorker )( error );
		getExitCallback( secondWorker )( 0 );

		return promise
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				err => {
					expect( err ).toEqual( error );
				}
			);
	} );

	it( 'should reject the promise if a worker emitted an error (second worker)', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;
		const error = new Error( 'Example error from a worker.' );

		getExitCallback( firstWorker )( 0 );
		getErrorCallback( secondWorker )( error );

		return promise
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				err => {
					expect( err ).toEqual( error );
				}
			);
	} );

	it( 'should split packages into threads one by one', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		expect( firstWorker.workerData ).toBeInstanceOf( Object );
		expect( firstWorker.workerData ).toHaveProperty( 'packages' );
		expect( firstWorker.workerData.packages ).toBeInstanceOf( Array );
		expect( firstWorker.workerData.packages ).toEqual( [
			'/home/ckeditor/my-packages/package-01',
			'/home/ckeditor/my-packages/package-03'
		] );

		expect( secondWorker.workerData ).toBeInstanceOf( Object );
		expect( secondWorker.workerData ).toHaveProperty( 'packages' );
		expect( secondWorker.workerData.packages ).toBeInstanceOf( Array );
		expect( secondWorker.workerData.packages ).toEqual( [
			'/home/ckeditor/my-packages/package-02',
			'/home/ckeditor/my-packages/package-04'
		] );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should remove the temporary module after execution', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;

		expect( fs.unlink ).toHaveBeenCalledTimes( 1 );
		expect( fs.unlink ).toHaveBeenCalledWith( '/home/ckeditor/uuid-4.mjs' );
	} );

	it( 'should remove the temporary module if the process is aborted', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		abortController.abort( 'SIGINT' );

		// Simulate the "Worker#terminate()" behavior.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;

		expect( fs.unlink ).toHaveBeenCalledTimes( 1 );
		expect( fs.unlink ).toHaveBeenCalledWith( '/home/ckeditor/uuid-4.mjs' );
	} );

	it( 'should remove the temporary module if the promise rejected', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker ] = stubs.WorkerMock.instances;
		const error = new Error( 'Example error from a worker.' );

		getErrorCallback( firstWorker )( error );

		return promise
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				() => {
					expect( fs.unlink ).toHaveBeenCalledTimes( 1 );
					expect( fs.unlink ).toHaveBeenCalledWith( '/home/ckeditor/uuid-4.mjs' );
				}
			);
	} );

	it( 'should terminate threads if the process is aborted', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		abortController.abort( 'SIGINT' );

		// Simulate the "Worker#terminate()" behavior.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;

		expect( firstWorker.terminate ).toHaveBeenCalledTimes( 1 );
		expect( secondWorker.terminate ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should attach listener to a worker that executes a callback once per worker', async () => {
		const signalEvent = vi.spyOn( abortController.signal, 'addEventListener' );
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		expect( registerAbortController ).toHaveBeenCalledTimes( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		abortController.abort( 'SIGINT' );

		// Simulate the "Worker#terminate()" behavior.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;

		expect( signalEvent ).toHaveBeenCalledTimes( 2 );
		expect( signalEvent ).toHaveBeenNthCalledWith(
			1,
			'abort',
			expect.any( Function ),
			expect.objectContaining( {
				once: true
			} )
		);
		expect( signalEvent ).toHaveBeenNthCalledWith(
			2,
			'abort',
			expect.any( Function ),
			expect.objectContaining( {
				once: true
			} )
		);

		expect( deregisterAbortController ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should register and deregister default abort controller if signal is not provided', async () => {
		const abortController = new AbortController();
		const signalEvent = vi.spyOn( abortController.signal, 'addEventListener' );

		registerAbortController.mockReturnValue( abortController );

		const options = Object.assign( {}, defaultOptions );
		delete options.signal;

		const promise = executeInParallel( options );
		await delay( 0 );

		expect( registerAbortController ).toHaveBeenCalledTimes( 1 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		abortController.abort( 'SIGINT' );

		// Simulate the "Worker#terminate()" behavior.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;

		expect( signalEvent ).toHaveBeenCalledTimes( 2 );
		expect( signalEvent ).toHaveBeenNthCalledWith(
			1,
			'abort',
			expect.any( Function ),
			expect.objectContaining( {
				once: true
			} )
		);
		expect( signalEvent ).toHaveBeenNthCalledWith(
			2,
			'abort',
			expect.any( Function ),
			expect.objectContaining( {
				once: true
			} )
		);

		expect( deregisterAbortController ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should update the progress when a package finished executing the callback', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;

		const firstWorkerPackageDone = getMessageCallback( firstWorker );
		const secondWorkerPackageDone = getMessageCallback( secondWorker );

		expect( outputHistory ).toHaveLength( 0 );
		firstWorkerPackageDone( 'done:package' );
		expect( outputHistory ).toContain( 'Status: 1/4.' );
		expect( outputHistory ).toHaveLength( 1 );
		secondWorkerPackageDone( 'done:package' );
		expect( outputHistory ).toContain( 'Status: 2/4.' );
		expect( outputHistory ).toHaveLength( 2 );
		secondWorkerPackageDone( 'done:package' );
		expect( outputHistory ).toHaveLength( 3 );
		expect( outputHistory ).toContain( 'Status: 3/4.' );
		firstWorkerPackageDone( 'done:package' );
		expect( outputHistory ).toHaveLength( 4 );
		expect( outputHistory ).toContain( 'Status: 4/4.' );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );

	it( 'should ignore messages from threads unrelated to the progress', async () => {
		const promise = executeInParallel( defaultOptions );
		await delay( 0 );

		const [ firstWorker, secondWorker ] = stubs.WorkerMock.instances;
		const firstWorkerPackageDone = getMessageCallback( firstWorker );

		expect( outputHistory ).toHaveLength( 0 );
		firstWorkerPackageDone( 'foo' );
		expect( outputHistory ).toHaveLength( 0 );

		// Workers did not emit an error.
		getExitCallback( firstWorker )( 0 );
		getExitCallback( secondWorker )( 0 );

		await promise;
	} );
} );

function delay( time ) {
	return new Promise( resolve => setTimeout( resolve, time ) );
}

function getExitCallback( fakeWorker ) {
	for ( const call of fakeWorker.on.mock.calls ) {
		const [ eventName, callback ] = call;

		if ( eventName === 'exit' ) {
			return callback;
		}
	}
}

function getMessageCallback( fakeWorker ) {
	for ( const call of fakeWorker.on.mock.calls ) {
		const [ eventName, callback ] = call;

		if ( eventName === 'message' ) {
			return callback;
		}
	}
}

function getErrorCallback( fakeWorker ) {
	for ( const call of fakeWorker.on.mock.calls ) {
		const [ eventName, callback ] = call;

		if ( eventName === 'error' ) {
			return callback;
		}
	}
}
