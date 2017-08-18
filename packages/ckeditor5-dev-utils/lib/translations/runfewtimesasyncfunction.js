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
 * @param {Number} [times=5]
 * @param {Number} [delay=100]
 * @returns {Promise}
 */
module.exports = function runFewTimesAsyncFunction( fn, times = 5, delay = 100 ) {
	let promise = fn();

	for ( let i = 0; i < times - 1; i++ ) {
		promise = promise.catch( err => {
			logger.error( err );
			logger.info( 'Trying again.' );

			return wait( delay ).then( fn );
		} );
	}

	return promise;
};

function wait( milliseconds ) {
	return new Promise( res => setTimeout( res, milliseconds ) );
}
