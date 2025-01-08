/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';

/**
 * Returns array with all directories under specified path.
 *
 * @param {string} directoryPath
 * @returns {Array}
 */
export default function getDirectories( directoryPath ) {
	const isDirectory = path => {
		try {
			return fs.statSync( path ).isDirectory();
		} catch ( e ) {
			return false;
		}
	};

	return fs.readdirSync( directoryPath ).filter( item => {
		return isDirectory( path.join( directoryPath, item ) );
	} );
}
