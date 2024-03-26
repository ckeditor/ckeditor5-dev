/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { walk, type Node } from 'estree-walker';
import type { ImportDeclaration, ExportAllDeclaration, ExportNamedDeclaration } from 'estree';
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

export function replaceImports( pluginOptions: RollupReplaceOptions ): Plugin {
	const options: Required<RollupReplaceOptions> = Object.assign(
		{ replace: [] },
		pluginOptions
	);

	function isModule( node: Node ): node is ImportDeclaration | ExportAllDeclaration | ExportNamedDeclaration {
		return [
			'ImportDeclaration',
			'ExportAllDeclaration',
			'ExportNamedDeclaration'
		].includes( node.type );
	}

	return {
		name: 'cke5-import-replace',

		renderChunk( source, chunk ) {
			const magic = new MagicString( source );
			const ast = this.parse( source );

			walk( ast, {
				enter( node ) {
					if ( !isModule( node ) || !node.source ) {
						return;
					}

					const path = node.source.value as string;
					const replacer = options.replace.find( ( [ pattern ] ) => RegExp( pattern ).test( path ) );

					if ( replacer ) {
						magic.overwrite(
							( node.source as any ).start + 1, // Skip opening quote
							( node.source as any ).end - 1, // Skip closing quote
							replacer[ 1 ]
						);
					}
				}
			} );

			if ( !magic.hasChanged() ) {
				return null;
			}

			return {
				code: magic.toString(),
				map: magic.generateMap( {
					source: chunk.fileName,
					includeContent: true,
					hires: 'boundary'
				} )
			};
		}
	};
}
