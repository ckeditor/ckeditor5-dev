/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import crypto from 'crypto';
import upath from 'upath';
import os from 'os';
import fs from 'fs/promises';
import { Worker } from 'worker_threads';
import { registerAbortController, deregisterAbortController } from './abortcontroller.js';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';

const WORKER_SCRIPT = new URL( './parallelworker.js', import.meta.url );

/**
 * This util allows executing a specified task in parallel using Workers. It can be helpful when executing a not resource-consuming
 * task in all packages specified in a path.
 *
 * If the callback loads dependencies, they must be specified directly in the function due to the worker's limitations.
 * Functions cannot be passed to workers. Hence, we store the callback as a Node.js file loaded by workers.
 *
 * @see https://nodejs.org/api/worker_threads.html
 * @param {object} options
 * @param {string} options.packagesDirectory Relative path to a location of packages to execute a task.
 * @param {function} options.taskToExecute A callback that is executed on all found packages.
 * It receives an absolute path to a package as an argument. It can be synchronous or may return a promise.
 * @param {ListrTaskObject} [options.listrTask={}] An instance of `ListrTask`.
 * @param {AbortSignal|null} [options.signal=null] Signal to abort the asynchronous process. If not set, default AbortController is created.
 * @param {object} [options.taskOptions=null] Optional data required by the task.
 * @param {ExecuteInParallelPackagesDirectoryFilter|null} [options.packagesDirectoryFilter=null] An optional callback allowing filtering out
 * directories/packages that should not be touched by the task.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @param {number} [options.concurrency=require( 'os' ).cpus().length / 2] Number of CPUs that will execute the task.
 * @returns {Promise}
 */
export default async function executeInParallel( options ) {
	const {
		packagesDirectory,
		taskToExecute,
		listrTask = {},
		signal = null,
		taskOptions = null,
		packagesDirectoryFilter = null,
		cwd = process.cwd(),
		concurrency = os.cpus().length / 2
	} = options;

	const concurrencyAsInteger = Math.floor( concurrency ) || 1;
	const packagesToProcess = await workspaces.findPathsToPackages( cwd, packagesDirectory, {
		packagesDirectoryFilter
	} );

	const packagesInThreads = getPackagesGroupedByThreads( packagesToProcess, concurrencyAsInteger );

	const callbackModule = upath.join( cwd, crypto.randomUUID() + '.mjs' );
	await fs.writeFile( callbackModule, `export default ${ taskToExecute };`, 'utf-8' );

	const onPackageDone = progressFactory( listrTask, packagesToProcess.length );

	let defaultAbortController;

	if ( !signal ) {
		defaultAbortController = registerAbortController();
	}

	const workers = packagesInThreads.map( packages => {
		return createWorker( {
			signal: signal || defaultAbortController.signal,
			onPackageDone,
			workerData: {
				packages,
				taskOptions,
				// The callback module is dynamically imported inside worker script.
				// To make it work in Windows, absolute path to a dynamically imported file must start with the "file:" protocol URL.
				callbackModule: 'file://' + callbackModule
			}
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
}

/**
 * @param {ListrTaskObject} listrTask
 * @param {number} total
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
 * @param {object} options
 * @param {AbortSignal} options.signal
 * @param {function} options.onPackageDone
 * @param {object} options.workerData
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
 * @param {Array.<string>} packages An array of absolute paths to packages.
 * @param {number} concurrency A number of threads.
 * @returns {Array.<Array.<string>>}
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
 * @typedef {object} ListrTaskObject
 *
 * @see https://listr2.kilic.dev/task/title.html
 * @see https://listr2.kilic.dev/task/output.html
 *
 * @property {string} title Title of the task.
 *
 * @property {string} output Update the current output of the task.
 */

/**
 * @callback ExecuteInParallelPackagesDirectoryFilter
 *
 * @param {string} directoryPath An absolute path to a directory.
 *
 * @returns {boolean} Whether to include (`true`) or skip (`false`) processing the given directory.
 */
