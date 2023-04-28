/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { Worker } = require( 'worker_threads' );
const crypto = require( 'crypto' );
const fs = require( 'fs-extra' );
const glob = require( 'glob' );

const WORKER_SCRIPT = path.join( __dirname, 'parallelworker.js' );

/**
 * @param {Object} options
 * @param {String} options.packagesDirectory
 * @param {Function} options.callback
 * @param {String} options.processDescription
 * @param {String} [options.cwd=process.cwd()]
 * @param {Number} [options.concurrency=require( 'os' ).cpus().length / 2]
 */
module.exports = async function executeInParallel( options ) {
	const {
		cwd = process.cwd(),
		packagesDirectory,
		callback,
		concurrency = require( 'os' ).cpus().length / 2,
		processDescription
	} = options;

	// TODO: Create a fancy counter/spinner.
	console.log( processDescription );

	const packages = glob.sync( `${ packagesDirectory }/*/`, { cwd, absolute: true } );

	const callbackModule = path.join( __dirname, crypto.randomUUID() + '.js' );
	fs.writeFileSync( callbackModule, `'use-strict';\nmodule.exports = ${ callback };`, 'utf-8' );

	// TODO: Detect CTRL+C to remove the created file.

	// To avoid having packages with a common prefix in a single thread, let's use a loop for assigning/
	// packages to threads.
	const packagesInThreads = packages.reduce( ( collection, packageItem, index ) => {
		const arrayIndex = index % concurrency;

		if ( !collection[ arrayIndex ] ) {
			collection.push( [] );
		}

		collection[ arrayIndex ].push( packageItem );

		return collection;
	}, [] );

	const workers = packagesInThreads.map( packages => createWorker( { packages, callbackModule } ) );

	return Promise.all( workers )
		.then( () => {
			console.log( 'Done' );
		} )
		.finally( () => {
			fs.removeSync( callbackModule );
		} );
};

function createWorker( workerData ) {
	return new Promise( ( resolve, reject ) => {
		const worker = new Worker( WORKER_SCRIPT, { workerData } );

		worker.on( 'error', err => {
			console.log( err );
			reject( err );
		} );
		worker.on( 'message', msg => {
			console.log( msg );
		} );
		worker.on( 'exit', code => {
			console.log( 'exit', { code } );
			resolve();
		} );

		return worker;
	} );
}
