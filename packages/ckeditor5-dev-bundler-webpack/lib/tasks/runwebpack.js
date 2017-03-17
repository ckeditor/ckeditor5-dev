/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const webpack = require( 'webpack' );

/**
 * @param {Object} config
 * @returns {Promise}
 */
module.exports = function runWebpack( config ) {
	return new Promise( ( resolve, reject ) => {
		webpack( config, ( err ) => {
			if ( err ) {
				return reject( err );
			}

			return resolve();
		} );
	} );
};
