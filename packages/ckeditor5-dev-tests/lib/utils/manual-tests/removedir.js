/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import del from 'del';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import chalk from 'chalk';

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
export default function removeDir( dir, options = {} ) {
	return del( dir ).then( () => {
		if ( !options.silent ) {
			logger().info( `Removed directory '${ chalk.cyan( dir ) }'` );
		}

		return Promise.resolve();
	} );
}
