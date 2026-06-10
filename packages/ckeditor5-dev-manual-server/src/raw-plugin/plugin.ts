/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

const RAW_QUERY = '?ckeditor5-raw';

export function rawHtmlPlugin(): Plugin {
	return {
		name: 'ckeditor5-raw',
		enforce: 'pre',

		resolveId( source, importer ) {
			if ( !importer || source.includes( '?' ) ) {
				return null;
			}

			if ( path.extname( source ) != '.html' ) {
				return null;
			}

			const filePath = resolveHtmlFilePath( source, importer );

			if ( filePath ) {
				return `${ filePath }${ RAW_QUERY }`;
			}

			return null;
		},

		async load( id ) {
			if ( !id.endsWith( RAW_QUERY ) ) {
				return null;
			}

			const filePath = id.slice( 0, -RAW_QUERY.length );
			const source = await readFile( filePath, 'utf8' );

			return {
				code: `export default ${ JSON.stringify( source ) };`,
				map: null
			};
		}
	};
}

function resolveHtmlFilePath( source: string, importer: string ): string | null {
	if ( !source.startsWith( '.' ) ) {
		return null;
	}

	const filePath = path.resolve( path.dirname( getFilePathFromId( importer ) ), source );

	return existsSync( filePath ) ? filePath : null;
}

function getFilePathFromId( id: string ): string {
	const queryIndex = id.indexOf( '?' );

	return queryIndex >= 0 ? id.slice( 0, queryIndex ) : id;
}
