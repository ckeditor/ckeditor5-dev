/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';

/**
 * Updates JSON file under a specified path.
 *
 * @param filePath Path to a file on disk.
 * @param updateFunction Function that will be called with a parsed JSON object. It should return the modified JSON object to save.
 */
export default function updateJSONFile( filePath: string, updateFunction: ( json: object ) => object ): void {
	const contents = fs.readFileSync( filePath, 'utf-8' );
	let json = JSON.parse( contents ) as object;
	json = updateFunction( json );

	fs.writeFileSync( filePath, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
}
