/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import os from 'os';
import { randomUUID } from 'crypto';
import upath from 'upath';
import fs from 'fs-extra';
import pacote from 'pacote';

export const manifest = cacheLessPacoteFactory( pacote.manifest );
export const packument = cacheLessPacoteFactory( pacote.packument );

function cacheLessPacoteFactory( callback ) {
	return async ( description, options = {} ) => {
		const uuid = randomUUID();
		const cacheDir = upath.join( os.tmpdir(), `pacote--${ uuid }` );

		await fs.ensureDir( cacheDir );

		try {
			return await callback( description, {
				...options,
				cache: cacheDir,
				memoize: false,
				preferOnline: true
			} );
		} finally {
			await fs.remove( cacheDir );
		}
	};
}
