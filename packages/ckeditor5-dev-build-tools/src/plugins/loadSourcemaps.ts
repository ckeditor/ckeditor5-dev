/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import type { Plugin } from 'rollup';

export function loadSourcemaps(): Plugin {
	return {
		name: 'load-sourcemaps',
		load( id: string ) {
			const sourceMapId = id + '.map';

			if ( !fs.existsSync( sourceMapId ) ) {
				return;
			}

			return {
				code: fs.readFileSync( id, 'utf-8' ),
				map: fs.readFileSync( sourceMapId, 'utf-8' )
			};
		}
	};
}
