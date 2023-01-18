/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const del = require( 'del' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const chalk = require( 'chalk' );

/**
 * Removes the specified directory.
 *
 * The `del` package protects you against deleting the current working directory and above.
 *
 * @param {String} dir Directory to remove.
 * @param {Object} [options={}] options
 * @param {Boolean} [options.silent=false] Whether to hide the path to the directory on the console.
 * @returns {Promise}
 */
module.exports = function removeDir( dir, options = {} ) {
	return del( dir ).then( () => {
		if ( !options.silent ) {
			logger().info( `Removed directory '${ chalk.cyan( dir ) }'` );
		}

		return Promise.resolve();
	} );
};
