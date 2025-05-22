/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import path from 'path';

/**
 * Returns array with all directories under the specified path.
 */
export default function getDirectories( directoryPath: string ): Array<string> {
	const isDirectory = ( directoryPath: string ) => {
		try {
			return fs.statSync( directoryPath ).isDirectory();
		} catch ( e ) {
			return false;
		}
	};

	return fs.readdirSync( directoryPath )
		.filter( item => {
			return isDirectory( path.join( directoryPath, item ) );
		} );
}
