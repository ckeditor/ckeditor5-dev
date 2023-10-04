/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const crypto = require( 'crypto' );
const upath = require( 'upath' );
const fs = require( 'fs/promises' );
const { Worker } = require( 'worker_threads' );
const { glob } = require( 'glob' );
const { registerAbortController, deregisterAbortController } = require( './abortcontroller' );

const WORKER_SCRIPT = upath.join( __dirname, 'parallelworker.js' );

/**
 * This util allows executing a specified task in parallel using Workers. It can be helpful when executing a not resource-consuming
 * task in all packages specified in a path.
 *
 * If the callback loads dependencies, they must be specified directly in the function due to the worker's limitations.
 * Functions cannot be passed to workers. Hence, we store the callback as a Node.js file loaded by workers.
 *
 * @see https://nodejs.org/api/worker_threads.html
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to execute a task.
 * @param {Function} options.taskToExecute A callback that is executed on all found packages.
 * It receives an absolute path to a package as an argument. It can be synchronous or may return a promise.
 * @param {ListrTaskObject} [options.listrTask={}] An instance of `ListrTask`.
 * @param {AbortSignal|null} [options.signal=null] Signal to abort the asynchronous process. If not set, default AbortController is created.
 * @param {Object} [options.taskOptions=null] Optional data required by the task.
 * @param {ExecuteInParallelPackagesDirectoryFilter|null} [options.packagesDirectoryFilter=null] An optional callback allowing filtering out
 * directories/packages that should not be touched by the task.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @param {Number} [options.concurrency=require( 'os' ).cpus().length / 2] Number of CPUs that will execute the task.
 * @returns {Promise}
 */
module.exports = async function executeInParallel( options ) {
	const {
		packagesDirectory,
		taskToExecute,
		listrTask = {},
		signal = null,
		taskOptions = null,
		packagesDirectoryFilter = null,
		cwd = process.cwd(),
		concurrency = require( 'os' ).cpus().length / 2
	} = options;

	const normalizedCwd = upath.toUnix( cwd );
	const packages = ( await glob( `${ packagesDirectory }/*/`, {
		cwd: normalizedCwd,
		absolute: true
	} ) ).map( upath.normalize );

	const packagesToProcess = packagesDirectoryFilter ?
		packages.filter( packagesDirectoryFilter ) :
		packages;

	const packagesInThreads = getPackagesGroupedByThreads( packagesToProcess, concurrency );

	const callbackModule = upath.join( cwd, crypto.randomUUID() + '.js' );
	await fs.writeFile( callbackModule, `'use strict';\nmodule.exports = ${ taskToExecute };`, 'utf-8' );

	const onPackageDone = progressFactory( listrTask, packagesToProcess.length );

	let defaultAbortController;

	if ( !signal ) {
		defaultAbortController = registerAbortController();
	}

	const workers = packagesInThreads.map( packages => {
		return createWorker( {
			signal: signal || defaultAbortController.signal,
			onPackageDone,
			workerData: { packages, callbackModule, taskOptions }
		} );
	} );

	return Promise.all( workers )
		.catch( err => {
			// `err` can be `undefined` if a process was aborted.
			if ( !err ) {
				return Promise.resolve();
			}

			return Promise.reject( err );
		} )
		.finally( async () => {
			await fs.unlink( callbackModule );

			if ( defaultAbortController ) {
				deregisterAbortController( defaultAbortController );
			}
		} );
};

/**
 * @param {ListrTaskObject} listrTask
 * @param {Number} total
 * @returns {Function}
 */
function progressFactory( listrTask, total ) {
	let done = 0;

	return () => {
		done += 1;
		listrTask.output = `Status: ${ done }/${ total }.`;
	};
}

/**
 * @param {Object} options
 * @param {AbortSignal} options.signal
 * @param {Function} options.onPackageDone
 * @param {Object} options.workerData
 * @returns {Promise}
 */
function createWorker( { signal, onPackageDone, workerData } ) {
	return new Promise( ( resolve, reject ) => {
		const worker = new Worker( WORKER_SCRIPT, { workerData } );

		signal.addEventListener( 'abort', () => {
			worker.terminate();
		}, { once: true } );

		worker.on( 'error', err => {
			reject( err );
		} );

		worker.on( 'message', msg => {
			if ( msg === 'done:package' ) {
				onPackageDone();
			}
		} );

		worker.on( 'exit', code => {
			return code ? reject() : resolve();
		} );

		return worker;
	} );
}

/**
 * Split the collection of packages into smaller chunks to process a task using threads.
 *
 * To avoid having packages with a common prefix in a single thread, use a loop for attaching packages to threads.
 *
 * @param {Array.<String>} packages An array of absolute paths to packages.
 * @param {Number} concurrency A number of threads.
 * @returns {Array.<Array.<String>>}
 */
function getPackagesGroupedByThreads( packages, concurrency ) {
	return packages.reduce( ( collection, packageItem, index ) => {
		const arrayIndex = index % concurrency;

		if ( !collection[ arrayIndex ] ) {
			collection.push( [] );
		}

		collection[ arrayIndex ].push( packageItem );

		return collection;
	}, [] );
}

/**
 * @typedef {Object} ListrTaskObject
 *
 * @see https://listr2.kilic.dev/api/classes/ListrTaskObject.html
 *
 * @property {String} title Title of the task.
 *
 * @property {String} output Update the current output of the task.
 */

/**
 * @callback ExecuteInParallelPackagesDirectoryFilter
 *
 * @param {String} directoryPath An absolute path to a directory.
 *
 * @returns {Boolean} Whether to include (`true`) or skip (`false`) processing the given directory.
 */
