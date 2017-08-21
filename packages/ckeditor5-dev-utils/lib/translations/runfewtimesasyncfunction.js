/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

/**
 * Runs hazardous function few times until the function's promise succeed.
 *
 * @param {Function} fn Function which will be called few times until the function's promise succeed.
 * @param {Object} [options={ times:5, delay:100 }] Options.
 * @param {Number} [options.times=5] Times of retrying.
 * @param {Number} [options.delay=100] Delay between fn calls. Useful for testing.
 * @returns {Promise}
 */
module.exports = function runFewTimesAsyncFunction( fn, { times = 5, delay = 100 } = {} ) {
	let promise = fn();

	for ( let i = 0; i < times - 1; i++ ) {
		promise = promise.catch( err => {
			logger.error( err );
			logger.info( `Trying again after ${ delay }ms...` );

			return wait( delay ).then( fn );
		} );
	}

	return promise;
};

function wait( milliseconds ) {
	return new Promise( res => setTimeout( res, milliseconds ) );
}
