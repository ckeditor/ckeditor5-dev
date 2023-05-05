/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/utils', () => {
	let executeInParallel, stubs, abortController, WorkerMock, defaultOptions;

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
				writeFileSync: sinon.stub(),
				unlinkSync: sinon.stub()
			},
			worker_threads: {
				Worker: WorkerMock
			},
			glob: {
				globSync: sinon.stub().returns( [
					'/home/ckeditor/my-packages/package-01',
					'/home/ckeditor/my-packages/package-02',
					'/home/ckeditor/my-packages/package-03',
					'/home/ckeditor/my-packages/package-04'
				] )
			},
			devUtils: {
				tools: {
					createSpinner: sinon.stub().callsFake( () => stubs.spinnerStub )
				}
			},
			spinnerStub: {
				start: sinon.stub(),
				finish: sinon.stub(),
				increase: sinon.stub()
			}
		};

		abortController = new AbortController();

		defaultOptions = {
			packagesDirectory: 'my-packages',
			processDescription: 'Just a test.',
			taskToExecute: packagePath => console.log( 'pwd', packagePath ),
			signal: abortController.signal
		};

		executeInParallel = proxyquire( '../../lib/utils/executeinparallel', {
			'@ckeditor/ckeditor5-dev-utils': stubs.devUtils,
			os: stubs.os,
			crypto: stubs.crypto,
			fs: stubs.fs,
			worker_threads: stubs.worker_threads,
			glob: stubs.glob
		} );
	} );

	afterEach( () => {
		sinon.restore();
	} );

	describe( 'executeInParallel()', () => {
		it( 'should execute the specified `taskToExecute` on all packages found in the `packagesDirectory`', async () => {
			const promise = executeInParallel( defaultOptions );

			expect( stubs.glob.globSync.callCount ).to.equal( 1 );
			expect( stubs.glob.globSync.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.have.property( 'cwd', '/home/ckeditor' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.have.property( 'absolute', true );

			expect( stubs.fs.writeFileSync.callCount ).to.equal( 1 );
			expect( stubs.fs.writeFileSync.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
			expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.equal(
				'\'use strict\';\nmodule.exports = packagePath => console.log( \'pwd\', packagePath );'
			);

			// By default the helper uses a half of available CPUs.
			expect( WorkerMock.instances ).to.lengthOf( 2 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

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

		it( 'should use the specified `cwd` when looking for packages', async () => {
			const options = Object.assign( {}, defaultOptions, {
				cwd: '/custom/cwd'
			} );

			const promise = executeInParallel( options );

			expect( stubs.glob.globSync.callCount ).to.equal( 1 );
			expect( stubs.glob.globSync.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.have.property( 'cwd', '/custom/cwd' );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should normalize the current working directory to unix-style (default value, Windows path)', async () => {
			stubs.process.cwd.returns( 'C:\\Users\\ckeditor' );
			const promise = executeInParallel( defaultOptions );

			expect( stubs.glob.globSync.callCount ).to.equal( 1 );
			expect( stubs.glob.globSync.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'C:/Users/ckeditor' );

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

			expect( stubs.glob.globSync.callCount ).to.equal( 1 );
			expect( stubs.glob.globSync.firstCall.args[ 0 ] ).to.equal( 'my-packages/*/' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.glob.globSync.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'C:/Users/ckeditor' );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should create the temporary module properly when using Windows-style paths', async () => {
			stubs.process.cwd.returns( 'C:\\Users\\ckeditor' );
			const promise = executeInParallel( defaultOptions );

			expect( stubs.fs.writeFileSync.callCount ).to.equal( 1 );
			expect( stubs.fs.writeFileSync.firstCall.args[ 0 ] ).to.equal( 'C:/Users/ckeditor/uuid-4.js' );
			expect( stubs.fs.writeFileSync.firstCall.args[ 1 ] ).to.equal(
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

			expect( WorkerMock.instances ).to.lengthOf( 4 );

			// Workers did not emit an error.
			for ( const worker of WorkerMock.instances ) {
				getExitCallback( worker )( 0 );
			}

			await promise;
		} );

		it( 'should resolve the promise if a worker finished (aborted) with a non-zero exit code (first worker)', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			getExitCallback( firstWorker )( 1 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should resolve the promise if a worker finished (aborted) with a non-zero exit code (second worker)', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 1 );

			await promise;
		} );

		it( 'should reject the promise if a worker emitted an error (first worker)', () => {
			const promise = executeInParallel( defaultOptions );
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

		it( 'should reject the promise if a worker emitted an error (second worker)', () => {
			const promise = executeInParallel( defaultOptions );
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
			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( stubs.fs.unlinkSync.callCount ).to.equal( 1 );
			expect( stubs.fs.unlinkSync.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
		} );

		it( 'should remove the temporary module if the process is aborted', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			abortController.abort( 'SIGINT' );

			// Simulate the "Worker#terminate()" behavior.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( stubs.fs.unlinkSync.callCount ).to.equal( 1 );
			expect( stubs.fs.unlinkSync.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
		} );

		it( 'should remove the temporary module if the promise rejected', () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker ] = WorkerMock.instances;
			const error = new Error( 'Example error from a worker.' );

			getErrorCallback( firstWorker )( error );

			return promise
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.fs.unlinkSync.callCount ).to.equal( 1 );
						expect( stubs.fs.unlinkSync.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor/uuid-4.js' );
					}
				);
		} );

		it( 'should terminate threads if the process is aborted', async () => {
			const promise = executeInParallel( defaultOptions );
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
		} );

		it( 'should create a spinner that informs a user about the progress', async () => {
			const promise = executeInParallel( defaultOptions );

			expect( stubs.devUtils.tools.createSpinner.callCount ).to.equal( 1 );
			expect( stubs.devUtils.tools.createSpinner.firstCall.args[ 0 ] ).to.equal( 'Just a test.' );
			expect( stubs.devUtils.tools.createSpinner.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.devUtils.tools.createSpinner.firstCall.args[ 1 ] ).to.have.property( 'total', 4 );
			expect( stubs.spinnerStub.start.callCount ).to.equal( 1 );

			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should increase the counter when a package finished executing the callback', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			const firstWorkerPackageDone = getMessageCallback( firstWorker );
			const secondWorkerPackageDone = getMessageCallback( secondWorker );

			expect( stubs.spinnerStub.increase.callCount ).to.equal( 0 ); // 0/4.
			firstWorkerPackageDone( 'done:package' );
			expect( stubs.spinnerStub.increase.callCount ).to.equal( 1 ); // 1/4.
			secondWorkerPackageDone( 'done:package' );
			expect( stubs.spinnerStub.increase.callCount ).to.equal( 2 ); // 2/4.
			secondWorkerPackageDone( 'done:package' );
			expect( stubs.spinnerStub.increase.callCount ).to.equal( 3 ); // 3/4.
			firstWorkerPackageDone( 'done:package' );
			expect( stubs.spinnerStub.increase.callCount ).to.equal( 4 ); // 4/4.

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should ignore messages from threads unrelated to the spinner', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker, secondWorker ] = WorkerMock.instances;
			const firstWorkerPackageDone = getMessageCallback( firstWorker );

			expect( stubs.spinnerStub.increase.callCount ).to.equal( 0 );
			firstWorkerPackageDone( 'foo' );
			expect( stubs.spinnerStub.increase.callCount ).to.equal( 0 );

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;
		} );

		it( 'should mark the process as completed if workers did not emit an error', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker, secondWorker ] = WorkerMock.instances;

			// Workers did not emit an error.
			getExitCallback( firstWorker )( 0 );
			getExitCallback( secondWorker )( 0 );

			await promise;

			expect( stubs.spinnerStub.finish.callCount ).to.equal( 1 );
			expect( stubs.spinnerStub.finish.firstCall.args[ 0 ] ).to.be.an( 'object' );
			expect( stubs.spinnerStub.finish.firstCall.args[ 0 ] ).to.have.property( 'emoji', '✔️ ' );
		} );

		it( 'should mark the process as errored if a worker finished with a non-zero exit code', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker ] = WorkerMock.instances;

			getExitCallback( firstWorker )( 1 );

			await promise;

			expect( stubs.spinnerStub.finish.callCount ).to.equal( 1 );
			expect( stubs.spinnerStub.finish.firstCall.args[ 0 ] ).to.be.an( 'object' );
			expect( stubs.spinnerStub.finish.firstCall.args[ 0 ] ).to.have.property( 'emoji', '❌' );
		} );

		it( 'should mark the process as errored if a worker emitted an error', async () => {
			const promise = executeInParallel( defaultOptions );
			const [ firstWorker ] = WorkerMock.instances;
			const error = new Error( 'Example error from a worker.' );

			getErrorCallback( firstWorker )( error );

			await promise
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);

			expect( stubs.spinnerStub.finish.callCount ).to.equal( 1 );
			expect( stubs.spinnerStub.finish.firstCall.args[ 0 ] ).to.be.an( 'object' );
			expect( stubs.spinnerStub.finish.firstCall.args[ 0 ] ).to.have.property( 'emoji', '❌' );
		} );
	} );
} );

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
