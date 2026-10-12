/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import upath from 'upath';

/**
 * Imports the default export of every file matching the pattern in the directory, sorted by path.
 */
export async function importDefaultExports( directory: string, pattern: string ): Promise<Array<{ file: string; value: unknown }>> {
	const files = globSync( pattern, { cwd: directory } );
	const modules = [];

	for ( const file of files.map( file => upath.normalize( file ) ).sort() ) {
		const { default: value } = await import( pathToFileURL( upath.join( directory, file ) ).href ) as { default: unknown };

		modules.push( { file, value } );
	}

	return modules;
}
