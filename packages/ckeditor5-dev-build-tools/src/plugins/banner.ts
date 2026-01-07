/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MagicString from 'magic-string';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { createFilter, type FilterPattern } from '@rollup/pluginutils';
import type { Plugin, OutputChunk, OutputAsset } from 'rollup';

export interface RollupBannerOptions {

	/**
	 * Banner that will be added to the top of the output files.
	 */
	banner: string;

	/**
	 * A valid [picomatch](https://github.com/micromatch/picomatch#globbing-features) pattern,
	 * or array of patterns. If omitted or has zero length, all files will have banner added.
	 *
	 * @default [ '**\/*.js', '**\/*.css', '**\/*.d.ts ]
	 */
	include?: FilterPattern;

	/**
	 * A valid [picomatch](https://github.com/micromatch/picomatch#globbing-features) pattern,
	 * or array of patterns. If omitted, no files will be filtered out.
	 *
	 * @default []
	 */
	exclude?: FilterPattern;
}

export function addBanner( pluginOptions: RollupBannerOptions ): Plugin {
	const options: Required<RollupBannerOptions> = Object.assign( {
		include: [ '**/*.js', '**/*.css', '**/*.d.ts' ],
		exclude: null
	}, pluginOptions );

	const filter = createFilter( options.include, options.exclude );

	return {
		name: 'cke5-add-banner',

		async generateBundle( outputOptions, bundle ) {
			/**
			 * Source maps cannot be overwritten using `chunk.map`. Instead,
			 * the old source map must be removed from the bundle,
			 * and the new source map with the same name must be added.
			 *
			 * See: https://github.com/rollup/rollup/issues/4665.
			 */
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

				/**
				 * Because MagicString doesn't read the original source map,
				 * we need to merge new source map with the original.
				 */
				const generator = SourceMapGenerator.fromSourceMap(
					await new SourceMapConsumer( newSourceMap )
				);

				generator.applySourceMap(
					await new SourceMapConsumer( JSON.parse( originalSourceMap.source.toString() ) )
				);

				delete bundle[ sourceMapName ];

				this.emitFile( {
					type: 'asset',
					fileName: sourceMapName,
					source: generator.toString()
				} );
			};

			/**
			 * Adds banner to the beginning of the asset and updates its source map.
			 */
			const updateAsset = ( asset: OutputAsset ) => {
				const magic = new MagicString( asset.source.toString() );
				magic.prepend( options.banner );

				asset.source = magic.toString();

				return updateSourceMap( asset.fileName, magic );
			};

			/**
			 * Adds banner to the beginning of the chunk and updates its source map.
			 */
			const updateChunk = ( chunk: OutputChunk ) => {
				const magic = new MagicString( chunk.code );
				magic.prepend( options.banner );

				chunk.code = magic.toString();

				return updateSourceMap( chunk.fileName, magic );
			};

			for ( const file of Object.values( bundle ) ) {
				if ( !filter( file.fileName ) ) {
					continue;
				}

				if ( file.type === 'asset' ) {
					await updateAsset( file );
				} else {
					await updateChunk( file );
				}
			}
		}
	};
}
