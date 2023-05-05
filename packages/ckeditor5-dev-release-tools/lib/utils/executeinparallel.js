/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const crypto = require( 'crypto' );
const path = require( 'path' );
const fs = require( 'fs' );
const { Worker } = require( 'worker_threads' );
const glob = require( 'glob' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const WORKER_SCRIPT = path.join( __dirname, 'parallelworker.js' );

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
 * @param {String} options.processDescription Description of the task displayed on a screen.
 * @param {Function} options.taskToExecute A callback that is executed on all found packages.
 * It receives an absolute path to a package as an argument. It can be synchronous or may return a promise.
 * @param {AbortSignal} options.signal Signal to abort the asynchronous process.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @param {Number} [options.concurrency=require( 'os' ).cpus().length / 2] Number of CPUs that will execute the task.
 * @returns {Promise}
 */
module.exports = function executeInParallel( options ) {
	const {
		packagesDirectory,
		processDescription,
		signal,
		taskToExecute,
		cwd = process.cwd(),
		concurrency = require( 'os' ).cpus().length / 2
	} = options;

	const packages = glob.sync( `${ packagesDirectory }/*/`, { cwd, absolute: true } );
	const packagesInThreads = getPackagesGroupedByThreads( packages, concurrency );

	const callbackModule = path.posix.join( cwd, crypto.randomUUID() + '.js' );
	fs.writeFileSync( callbackModule, `'use strict';\nmodule.exports = ${ taskToExecute };`, 'utf-8' );

	const counter = tools.createSpinner( processDescription, { total: packages.length } );
	counter.start();

	const workers = packagesInThreads.map( packages => createWorker( signal, counter, { packages, callbackModule } ) );

	return Promise.all( workers )
		.then( () => {
			counter.finish( { emoji: '✔️ ' } );
		} )
		.catch( err => {
			counter.finish( { emoji: '❌' } );

			// `err` can be `undefined` if a process was aborted.
			if ( !err ) {
				return Promise.resolve();
			}

			return Promise.reject( err );
		} )
		.finally( () => {
			fs.unlinkSync( callbackModule );
		} );
};

/**
 * @param {AbortSignal} signal
 * @param {CKEditor5Spinner} counter
 * @param {Object} workerData
 * @returns {Promise}
 */
function createWorker( signal, counter, workerData ) {
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
				counter.increase();
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
