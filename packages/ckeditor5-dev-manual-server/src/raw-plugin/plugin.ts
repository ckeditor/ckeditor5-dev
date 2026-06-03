/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'vite';

const RAW_QUERY = '?raw';

export function rawHtmlPlugin(): Plugin {
	return {
		name: 'ckeditor5-raw',
		enforce: 'pre',

		async resolveId( source, importer ) {
			if ( !importer || source.includes( '?' ) ) {
				return null;
			}

			if ( !source.endsWith( '.html' ) ) {
				return null;
			}

			return this.resolve( `${ source }${ RAW_QUERY }`, importer, { skipSelf: true } );
		}
	};
}
