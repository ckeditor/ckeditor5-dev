/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';

/**
 * Updates JSON file under specified path.
 *
 * @param {string} filePath Path to file on disk.
 * @param {function} updateFunction Function that will be called with parsed JSON object. It should return
 * modified JSON object to save.
 */
export default function updateJSONFile( filePath, updateFunction ) {
	const contents = fs.readFileSync( filePath, 'utf-8' );
	let json = JSON.parse( contents );
	json = updateFunction( json );

	fs.writeFileSync( filePath, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
}
