/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'util';
import { deleteAsync } from 'del';
import { logger } from '@ckeditor/ckeditor5-dev-utils';

/**
 * Removes the specified directory.
 *
 * The `del` package protects you against deleting the current working directory and above.
 *
 * @param {string} dir Directory to remove.
 * @param {object} [options={}] options
 * @param {boolean} [options.silent=false] Whether to hide the path to the directory on the console.
 * @returns {Promise}
 */
export default function removeDir( dir, options = {} ) {
	return deleteAsync( dir ).then( () => {
		if ( !options.silent ) {
			logger().info( `Removed directory '${ styleText( 'cyan', dir ) }'` );
		}

		return Promise.resolve();
	} );
}
