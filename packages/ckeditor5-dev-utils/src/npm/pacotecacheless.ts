/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import os from 'node:os';
import { randomUUID } from 'node:crypto';
import upath from 'upath';
import fs from 'node:fs/promises';
import pacote from 'pacote';

export const manifest = cacheLessPacoteFactory( pacote.manifest );
export const packument = cacheLessPacoteFactory( pacote.packument );

/**
 * Creates a version of a `pacote` function that doesn't use caching.
 */
function cacheLessPacoteFactory<T extends ( ...args: Array<any> ) => any>( callback: T ) {
	return async ( ...args: Parameters<T> ): Promise<Awaited<ReturnType<T>>> => {
		const [ description, options = {} ] = args as unknown as [ string, any ];

		const uuid = randomUUID();
		const cacheDir = upath.join( os.tmpdir(), `pacote--${ uuid }` );

		await fs.mkdir( cacheDir, { recursive: true } );

		try {
			return await callback( description, {
				...options,
				cache: cacheDir,
				memoize: false,
				preferOnline: true
			} );
		} finally {
			await fs.rm( cacheDir, { recursive: true, force: true } );
		}
	};
}
