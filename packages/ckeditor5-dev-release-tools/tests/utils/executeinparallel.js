/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/utils', () => {
	let executeInParallel, stubs, abortController, WorkerMock, defaultOptions, outputHistory;

	beforeEach( () => {
		WorkerMock = class {
			constructor( script, options ) {
				// Define a static property that keeps all instances for a particular test scenario.
				if ( !this.constructor.instances ) {
					this.constructor.instances = [];
				}

				this.constructor.instances.push( this );

				this.workerData = options.workerData;
				this.on = sinon.stub();
				this.terminate = sinon.stub();

				expect( script.endsWith( 'parallelworker.js' ) ).to.equal( true );
			}
		};

		outputHistory = [];

		stubs = {
			process: {
				cwd: sinon.stub( process, 'cwd' ).returns( '/home/ckeditor' )
			},
			os: {
				cpus: sinon.stub().returns( new Array( 4 ) )
			},
			crypto: {
				randomUUID: sinon.stub().returns( 'uuid-4' )
			},
			fs: {
				writeFile: sinon.stub().resolves(),
				unlink: sinon.stub().resolves()
			},
			worker_threads: {
				Worker: WorkerMock
			},
			glob: {
				glob: sinon.stub().resolves( [
					'/home/ckeditor/my-packages/package-01',
					'/home/ckeditor/my-packages/package-02',
					'/home/ckeditor/my-packages/package-03',
					'/home/ckeditor/my-packages/package-04'
				] )
			},
			spinnerStub: {
				start: sinon.stub(),
				finish: sinon.stub(),
				increase: sinon.stub()
			},
			abortController: {
				registerAbortController: sinon.stub(),
				deregisterAbortController: sinon.stub()
			}
		};

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

		executeInParallel = proxyquire( '../../lib/utils/executeinparallel', {
			os: stubs.os,
			crypto: stubs.crypto,
			'fs/promises': stubs.fs,
			worker_threads: stubs.worker_threads,
			glob: stubs.glob,
			'./abortcontroller': stubs.abortController
		} );
	} );

	afterEach( () => {
		sinon.restore();
	} );

	describe( 'executeInParallel()', () => {
		it( 'should execute the specified `taskToExecute` on all packages found in the `packagesDirectory`', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			// By default the helper uses a half of available CPUs.
			expect( WorkerMock.instances ).to.lengthOf( 2 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			expect( stubs.glob.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', '/home/ckeditor' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'absolute', true );

			expect( stubs.fs.writeFile.callCount ).to.equal( 1 );
			expect( stubs.fs.writeFile.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
			expect( stubs.fs.writeFile.firstCall.args[ 1 ] ).to.equal(
				'\'use strict\';\nmodule.exports = packagePath => console.log( \'pwd\', packagePath );'
			);
			expect( firstWorker.workerData ).to.be.an( 'object' );
			expect( firstWorker.workerData ).to.have.property( 'callbackModule', '/home/ckeditor/uuid-4.js' );
			expect( firstWorker.workerData ).to.have.property( 'packages' );

			expect( secondWorker.workerData ).to.be.an( 'object' );
			expect( secondWorker.workerData ).to.have.property( 'callbackModule', '/home/ckeditor/uuid-4.js' );
			expect( secondWorker.workerData ).to.have.property( 'packages' );

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should execute the specified `taskToExecute` on packages found in the `packagesDirectory` that are not filtered', async () => {
			const options = Object.assign( {}, defaultOptions, {
				// Skip "package-02".
				packagesDirectoryFilter: packageDirectory => !packageDirectory.endsWith( 'package-02' )
			} );

			const promise = executeInParallel( options );
			await delay( 0 );

			// By default the helper uses a half of available CPUs.
			expect( WorkerMock.instances ).to.lengthOf( 2 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			expect( firstWorker.workerData.packages ).to.deep.equal( [
				'/home/ckeditor/my-packages/package-01',
				'/home/ckeditor/my-packages/package-04'
			] );

			expect( secondWorker.workerData.packages ).to.deep.equal( [
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

			expect( stubs.glob.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', '/custom/cwd' );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should normalize the current working directory to unix-style (default value, Windows path)', async () => {
			stubs.process.cwd.returns( 'C:\\Users\\ckeditor' );

			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			expect( stubs.glob.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'C:/Users/ckeditor' );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should normalize the current working directory to unix-style (`options.cwd`, Windows path)', async () => {
			const options = Object.assign( {}, defaultOptions, {
				cwd: 'C:\\Users\\ckeditor'
			} );

			const promise = executeInParallel( options );
			await delay( 0 );

			expect( stubs.glob.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'C:/Users/ckeditor' );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should work on normalized paths to packages', async () => {
			stubs.glob.glob.resolves( [
				'C:/Users/workspace/ckeditor/my-packages/package-01',
				'C:/Users/workspace/ckeditor/my-packages/package-02',
				'C:/Users/workspace/ckeditor/my-packages/package-03',
				'C:/Users/workspace/ckeditor/my-packages/package-04'
			] );

			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			// By default the helper uses a half of available CPUs.
			expect( WorkerMock.instances ).to.lengthOf( 2 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			expect( firstWorker.workerData.packages ).to.deep.equal( [
				'C:/Users/workspace/ckeditor/my-packages/package-01',
				'C:/Users/workspace/ckeditor/my-packages/package-03'
			] );

			expect( secondWorker.workerData.packages ).to.deep.equal( [
				'C:/Users/workspace/ckeditor/my-packages/package-02',
				'C:/Users/workspace/ckeditor/my-packages/package-04'
			] );

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
			expect( WorkerMock.instances ).to.lengthOf( 2 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			expect( firstWorker.workerData ).to.be.an( 'object' );
			expect( firstWorker.workerData ).to.have.deep.property( 'taskOptions', taskOptions );

			expect( secondWorker.workerData ).to.be.an( 'object' );
			expect( secondWorker.workerData ).to.have.property( 'taskOptions', taskOptions );

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should create the temporary module properly when using Windows-style paths', async () => {
			stubs.process.cwd.returns( 'C:\\Users\\ckeditor' );

			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			expect( stubs.fs.writeFile.callCount ).to.equal( 1 );
			expect( stubs.fs.writeFile.firstCall.args[ 0 ] ).to.equal( 'C:/Users/ckeditor/uuid-4.js' );
			expect( stubs.fs.writeFile.firstCall.args[ 1 ] ).to.equal(
				'\'use strict\';\nmodule.exports = packagePath => console.log( \'pwd\', packagePath );'
			);

			// By default the helper uses a half of available CPUs.
			expect( WorkerMock.instances ).to.lengthOf( 2 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			expect( firstWorker.workerData ).to.be.an( 'object' );
			expect( firstWorker.workerData ).to.have.property( 'callbackModule', 'C:/Users/ckeditor/uuid-4.js' );
			expect( firstWorker.workerData ).to.have.property( 'packages' );

			expect( secondWorker.workerData ).to.be.an( 'object' );
			expect( secondWorker.workerData ).to.have.property( 'callbackModule', 'C:/Users/ckeditor/uuid-4.js' );
			expect( secondWorker.workerData ).to.have.property( 'packages' );

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

			expect( WorkerMock.instances ).to.lengthOf( 4 );

			// Workers did not emit an error.
			for ( const worker of WorkerMock.instances ) {
				getExitCallback( worker )( 0 );
			}

			await promise;
		} );

		it( 'should resolve the promise if a worker finished (aborted) with a non-zero exit code (first worker)', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			getExitCallback( firstWorker )( 1 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should resolve the promise if a worker finished (aborted) with a non-zero exit code (second worker)', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 1 );

			await promise;
		} );

		it( 'should reject the promise if a worker emitted an error (first worker)', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;
			const error = new Error( 'Example error from a worker.' );

			getErrorCallback( firstWorker )( error );
			getExitCallback( secondWorker )( 0 );

			return promise
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);
		} );

		it( 'should reject the promise if a worker emitted an error (second worker)', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;
			const error = new Error( 'Example error from a worker.' );

			getExitCallback( firstWorker )( 0 );
			getErrorCallback( secondWorker )( error );

			return promise
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);
		} );

		it( 'should split packages into threads one by one', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			expect( firstWorker.workerData ).to.be.an( 'object' );
			expect( firstWorker.workerData ).to.have.property( 'packages' );
			expect( firstWorker.workerData.packages ).to.be.an( 'array' );
			expect( firstWorker.workerData.packages ).to.deep.equal( [
				'/home/ckeditor/my-packages/package-01',
				'/home/ckeditor/my-packages/package-03'
			] );

			expect( secondWorker.workerData ).to.be.an( 'object' );
			expect( secondWorker.workerData ).to.have.property( 'packages' );
			expect( secondWorker.workerData.packages ).to.be.an( 'array' );
			expect( secondWorker.workerData.packages ).to.deep.equal( [
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

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( stubs.fs.unlink.callCount ).to.equal( 1 );
			expect( stubs.fs.unlink.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
		} );

		it( 'should remove the temporary module if the process is aborted', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			abortController.abort( 'SIGINT' );

			// Simulate the "Worker#terminate()" behavior.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( stubs.fs.unlink.callCount ).to.equal( 1 );
			expect( stubs.fs.unlink.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
		} );

		it( 'should remove the temporary module if the promise rejected', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker ] = WorkerMock.instances;
			const error = new Error( 'Example error from a worker.' );

			getErrorCallback( firstWorker )( error );

			return promise
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.fs.unlink.callCount ).to.equal( 1 );
						expect( stubs.fs.unlink.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
					}
				);
		} );

		it( 'should terminate threads if the process is aborted', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			abortController.abort( 'SIGINT' );

			// Simulate the "Worker#terminate()" behavior.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( firstWorker.terminate.callCount ).to.equal( 1 );
			expect( secondWorker.terminate.callCount ).to.equal( 1 );
		} );

		it( 'should attach listener to a worker that executes a callback once per worker', async () => {
			const signalEvent = sinon.stub( abortController.signal, 'addEventListener' );
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			expect( stubs.abortController.registerAbortController.callCount ).to.equal( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			abortController.abort( 'SIGINT' );

			// Simulate the "Worker#terminate()" behavior.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( signalEvent.callCount ).to.equal( 2 );

			expect( signalEvent.firstCall.args[ 0 ] ).to.equal( 'abort' );
			expect( signalEvent.firstCall.args[ 1 ] ).to.be.a( 'function' );
			expect( signalEvent.firstCall.args[ 2 ] ).to.be.an( 'object' );
			expect( signalEvent.firstCall.args[ 2 ] ).to.have.property( 'once', true );

			expect( signalEvent.secondCall.args[ 0 ] ).to.equal( 'abort' );
			expect( signalEvent.secondCall.args[ 1 ] ).to.be.a( 'function' );
			expect( signalEvent.secondCall.args[ 2 ] ).to.be.an( 'object' );
			expect( signalEvent.secondCall.args[ 2 ] ).to.have.property( 'once', true );

			expect( stubs.abortController.deregisterAbortController.callCount ).to.equal( 0 );
		} );

		it( 'should register and deregister default abort controller if signal is not provided', async () => {
			const abortController = new AbortController();
			const signalEvent = sinon.stub( abortController.signal, 'addEventListener' );

			stubs.abortController.registerAbortController.returns( abortController );

			const options = Object.assign( {}, defaultOptions );
			delete options.signal;

			const promise = executeInParallel( options );
			await delay( 0 );

			expect( stubs.abortController.registerAbortController.callCount ).to.equal( 1 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			abortController.abort( 'SIGINT' );

			// Simulate the "Worker#terminate()" behavior.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( signalEvent.callCount ).to.equal( 2 );

			expect( signalEvent.firstCall.args[ 0 ] ).to.equal( 'abort' );
			expect( signalEvent.firstCall.args[ 1 ] ).to.be.a( 'function' );
			expect( signalEvent.firstCall.args[ 2 ] ).to.be.an( 'object' );
			expect( signalEvent.firstCall.args[ 2 ] ).to.have.property( 'once', true );

			expect( signalEvent.secondCall.args[ 0 ] ).to.equal( 'abort' );
			expect( signalEvent.secondCall.args[ 1 ] ).to.be.a( 'function' );
			expect( signalEvent.secondCall.args[ 2 ] ).to.be.an( 'object' );
			expect( signalEvent.secondCall.args[ 2 ] ).to.have.property( 'once', true );

			expect( stubs.abortController.deregisterAbortController.callCount ).to.equal( 1 );
		} );

		it( 'should update the progress when a package finished executing the callback', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			const firstWorkerPackageDone = getMessageCallback( firstWorker );
			const secondWorkerPackageDone = getMessageCallback( secondWorker );

			expect( outputHistory ).to.lengthOf( 0 );
			firstWorkerPackageDone( 'done:package' );
			expect( outputHistory ).to.include( 'Status: 1/4.' );
			expect( outputHistory ).to.lengthOf( 1 );
			secondWorkerPackageDone( 'done:package' );
			expect( outputHistory ).to.include( 'Status: 2/4.' );
			expect( outputHistory ).to.lengthOf( 2 );
			secondWorkerPackageDone( 'done:package' );
			expect( outputHistory ).to.lengthOf( 3 );
			expect( outputHistory ).to.include( 'Status: 3/4.' );
			firstWorkerPackageDone( 'done:package' );
			expect( outputHistory ).to.lengthOf( 4 );
			expect( outputHistory ).to.include( 'Status: 4/4.' );

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should ignore messages from threads unrelated to the progress', async () => {
			const promise = executeInParallel( defaultOptions );
			await delay( 0 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;
			const firstWorkerPackageDone = getMessageCallback( firstWorker );

			expect( outputHistory ).to.lengthOf( 0 );
			firstWorkerPackageDone( 'foo' );
			expect( outputHistory ).to.lengthOf( 0 );

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );
	} );
} );

function delay( time ) {
	return new Promise( resolve => setTimeout( resolve, time ) );
}

function getExitCallback( fakeWorker ) {
	for ( const call of fakeWorker.on.getCalls() ) {
		const [ eventName, callback ] = call.args;

		if ( eventName === 'exit' ) {
			return callback;
		}
	}
}

function getMessageCallback( fakeWorker ) {
	for ( const call of fakeWorker.on.getCalls() ) {
		const [ eventName, callback ] = call.args;

		if ( eventName === 'message' ) {
			return callback;
		}
	}
}

function getErrorCallback( fakeWorker ) {
	for ( const call of fakeWorker.on.getCalls() ) {
		const [ eventName, callback ] = call.args;

		if ( eventName === 'error' ) {
			return callback;
		}
	}
}
