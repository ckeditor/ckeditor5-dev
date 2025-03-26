/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fsExtra from 'fs-extra';
import fs from 'fs/promises';
import upath from 'upath';

export async function removeEmptyDirs( directory: string ): Promise<void> {
	if ( !fsExtra.existsSync( directory ) ) {
		return;
	}

	const files = await fs.readdir( directory );

	// Recursively remove subdirectories
	for ( const file of files ) {
		const fullPath = upath.join( directory, file );
		if ( ( await fs.stat( fullPath ) ).isDirectory() ) {
			await removeEmptyDirs( fullPath );
		}
	}

	// Check again if directory is empty after processing subdirectories
	if ( ( await fs.readdir( directory ) )?.length === 0 ) {
		await fs.rmdir( directory );
	}
}
