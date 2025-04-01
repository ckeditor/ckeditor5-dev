/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { accessSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Plugin } from 'rollup';

export function loadTypeScriptSources(): Plugin {
	const cache: Record<string, string | null> = {};

	return {
		name: 'load-typescript-sources',

		resolveId( source: string, importer: string | undefined ) {
			if ( !importer || !source.startsWith( '.' ) || !source.endsWith( '.js' ) ) {
				return null;
			}

			const path = resolve(
				dirname( importer ),
				source.replace( /\.js$/, '.ts' )
			);

			if ( cache[ path ] ) {
				return cache[ path ];
			}

			try {
				accessSync( path );
				cache[ path ] = path;

				return path;
			} catch {
				cache[ path ] = null;

				return null;
			}
		}
	};
}
