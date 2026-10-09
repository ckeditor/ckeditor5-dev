/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';

/**
 * Runs the read and returns `null` instead of throwing when the file does not exist.
 */
export async function readIfExists<T>( read: () => Promise<T> ): Promise<T | null> {
	try {
		return await read();
	} catch ( error ) {
		if ( ( error as NodeJS.ErrnoException ).code === 'ENOENT' ) {
			return null;
		}

		throw error;
	}
}

/**
 * Whether a normalized relative path points outside of the directory it is relative to.
 */
export function isOutside( relativePath: string ): boolean {
	return relativePath === '..' || relativePath.startsWith( '../' ) || upath.isAbsolute( relativePath );
}
