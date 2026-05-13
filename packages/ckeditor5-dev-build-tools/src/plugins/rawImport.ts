/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Plugin } from 'rolldown';

/**
 * Allows importing raw file content using the `?raw` query parameter.
 */
export function rawImport(): Plugin {
	const rawRE = /[?&]raw\b/;

	return {
		name: 'cke5-raw-import',

		resolveId: {
			filter: {
				id: rawRE
			},

			handler( source, importer ) {
				if ( !importer ) {
					return null;
				}

				const cleaned = source.replace( rawRE, '' );

				return resolve( dirname( importer ), cleaned ) + '?raw';
			}
		},

		load: {
			filter: {
				id: rawRE
			},

			handler( id ) {
				const [ path ] = id.split( '?' );

				return {
					code: fs.readFileSync( path!, 'utf-8' ),
					moduleType: 'text'
				};
			}
		}
	};
}
