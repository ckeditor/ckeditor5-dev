/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
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
	 * If the third element is set to `true`, the replacement will be done BEFORE bundling,
	 * meaning that the import will be replaced in the source code, not only in the resulting bundle.
	 *
	 * @default []
	 */
	replace: Array<[ RegExp | string, string, true? ]>;
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

	const transformReplace: Array<[ RegExp | string, string ]> = [];
	const renderReplace: Array<[ RegExp | string, string ]> = [];

	options.replace.forEach( ( [ pattern, replacement, transformOnly ] ) => {
		if ( transformOnly === true ) {
			transformReplace.push( [ pattern, replacement ] );
		} else {
			renderReplace.push( [ pattern, replacement ] );
		}
	} );

	return {
		name: 'cke5-replace-import',

		transform( source ) {
			const magic = new MagicString( source );

			transformReplace.forEach( replace => magic.replaceAll( ...replace ) );

			return {
				code: magic.toString(),
				map: magic.generateMap( {
					includeContent: true,
					hires: 'boundary'
				} )
			};
		},

		renderChunk( source, chunk ) {
			const magic = new MagicString( source );
			const ast = this.parse( source );

			walk( ast as Node, {
				enter( node ) {
					if ( !isModule( node ) || !node.source ) {
						return;
					}

					const path = node.source.value as string;

					const replacer = renderReplace.find( ( [ pattern ] ) => {
						if ( typeof pattern === 'string' ) {
							return pattern === path;
						}

						return pattern.test( path );
					} );

					if ( replacer ) {
						magic.overwrite(
							( node.source as any ).start + 1, // Skip opening quote
							( node.source as any ).end - 1, // Skip closing quote
							path.replace( ...replacer )
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
