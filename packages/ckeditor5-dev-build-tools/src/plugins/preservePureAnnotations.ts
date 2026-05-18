/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MagicString from 'magic-string';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';
import type { OutputAsset, OutputChunk, Plugin } from 'rolldown';

const PURE_ANNOTATION = '/* @__PURE__ */';
const PRESERVED_PURE_ANNOTATION = '/* @__PURE__ -- @preserve */';

/**
 * Restores the `@preserve` marker removed by Rolldown when it normalizes pure annotations.
 *
 * This plugin can be removed once https://github.com/rolldown/rolldown/issues/9408 is fixed.
 */
export function preservePureAnnotations(): Plugin {
	return {
		name: 'cke5-preserve-pure-annotations',

		async generateBundle( outputOptions, bundle ) {
			const updateSourceMap = async ( fileName: string, magic: MagicString ): Promise<void> => {
				if ( !outputOptions.sourcemap ) {
					return;
				}

				const sourceMapName = fileName + '.map';
				const originalSourceMap = bundle[ sourceMapName ] as OutputAsset | undefined;

				if ( !originalSourceMap ) {
					return;
				}

				const newSourceMap = magic.generateMap( {
					hires: 'boundary',
					file: sourceMapName,
					source: fileName,
					includeContent: true
				} );

				const generator = SourceMapGenerator.fromSourceMap(
					await new SourceMapConsumer( newSourceMap )
				);

				const originalMapConsumer = await new SourceMapConsumer(
					JSON.parse( originalSourceMap.source.toString() )
				);

				generator.applySourceMap(
					originalMapConsumer,
					fileName
				);

				originalSourceMap.source = generator.toString();
			};

			const updateChunk = ( chunk: OutputChunk ) => {
				if ( !chunk.code.includes( PURE_ANNOTATION ) ) {
					return;
				}

				const magic = new MagicString( chunk.code );
				let index = chunk.code.indexOf( PURE_ANNOTATION );

				while ( index !== -1 ) {
					magic.overwrite( index, index + PURE_ANNOTATION.length, PRESERVED_PURE_ANNOTATION );
					index = chunk.code.indexOf( PURE_ANNOTATION, index + PURE_ANNOTATION.length );
				}

				chunk.code = magic.toString();

				return updateSourceMap( chunk.fileName, magic );
			};

			for ( const item of Object.values( bundle ) ) {
				if ( item.type === 'chunk' ) {
					await updateChunk( item );
				}
			}
		}
	};
}
