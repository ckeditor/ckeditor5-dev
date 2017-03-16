/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const webpack = require( 'webpack' );

/**
 * @param {Object} webpackConfig
 * @returns {Promise}
 */
module.exports = function runWebpack( webpackConfig ) {
	return new Promise( ( resolve, reject ) => {
		webpack( webpackConfig, ( err ) => {
			if ( err ) {
				return reject( err );
			}

			return resolve();
		} );
	} );
};
