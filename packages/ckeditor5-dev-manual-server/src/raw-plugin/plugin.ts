/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'vite';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const RAW_QUERY = '?ckeditor5-raw';

export function rawHtmlPlugin(): Plugin {
	return {
		name: 'ckeditor5-raw',
		enforce: 'pre',

		async resolveId( source, importer ) {
			if ( !importer || source.includes( '?' ) ) {
				return null;
			}

			if ( path.extname( source ) != '.html' ) {
				return null;
			}

			const resolved = await this.resolve( source, importer, { skipSelf: true } );

			if ( !resolved ) {
				return null;
			}

			return `${ getFilePathFromId( resolved.id ) }${ RAW_QUERY }`;
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

function getFilePathFromId( id: string ): string {
	const queryIndex = id.indexOf( '?' );

	return queryIndex >= 0 ? id.slice( 0, queryIndex ) : id;
}
