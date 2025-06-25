/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import { resolve, dirname } from 'path';
import type { Plugin } from 'rollup';

/**
 * Allows importing raw file content using the `?raw` query parameter.
 */
export function rawImport(): Plugin {
	const rawRE = /[?&]raw\b/;

	return {
		name: 'cke5-raw-import',

		resolveId( source, importer ) {
			if ( !importer || !rawRE.test( source ) ) {
				return null;
			}

			const cleaned = source.replace( rawRE, '' );

			return resolve( dirname( importer ), cleaned ) + '?raw';
		},

		load( id ) {
			if ( !rawRE.test( id ) ) {
				return null;
			}

			const [ path ] = id.split( '?' );
			const content = fs.readFileSync( path!, 'utf-8' );

			return `export default ${ JSON.stringify( content ) };`;
		}
	};
}
