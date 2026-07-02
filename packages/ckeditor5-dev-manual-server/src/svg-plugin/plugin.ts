/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

export function rawSvgPlugin(): Plugin {
	return {
		name: 'ckeditor5-raw-svg',
		enforce: 'pre',

		load: {
			filter: {
				id: {
					include: /\.svg$/
				}
			},

			handler( id ) {
				const content = readFileSync( id, 'utf-8' );

				return {
					code: `export default ${ JSON.stringify( content ) };`,
					map: null
				};
			}
		}
	};
}
