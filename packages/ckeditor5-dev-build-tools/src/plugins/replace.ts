/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MagicString from 'magic-string';
import type { Plugin } from 'rollup';

export interface RollupReplaceOptions {

	/**
	 * Array containing tuples of pattern and replace value. RegExp must have the `/g` flag.
	 *
	 * @example
	 * [
	 *   [ 'find', 'replace' ],
	 *   [ /find/g, 'replace' ]
	 * ]
	 *
	 * @default []
	 */
	replace: Array<[ RegExp | string, string ]>;
}

export function replace( pluginOptions: RollupReplaceOptions ): Plugin {
	const options: Required<RollupReplaceOptions> = Object.assign(
		{ replace: [] },
		pluginOptions
	);

	return {
		name: 'cke5-replace',

		renderChunk( source, chunk ) {
			const magic = new MagicString( source );

			options.replace.forEach( replace => magic.replaceAll( ...replace ) );

			return {
				code: magic.toString(),
				map: magic.generateMap( {
					source: chunk.fileName,
					includeContent: true,
					hires: true
				} )
			};
		}
	};
}
