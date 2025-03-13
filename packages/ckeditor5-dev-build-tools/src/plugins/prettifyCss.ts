/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import MagicString from 'magic-string';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { createFilter } from '@rollup/pluginutils';
import type { Plugin, OutputAsset } from 'rollup';
import * as prettier from 'prettier';

export function prettifyCss( filename: string ): Plugin {
	const filter = createFilter( [ `**/${ filename }` ], null );

	return {
		name: 'cke5-prettify-css',

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
			const updateAsset = async ( asset: OutputAsset ) => {
				const assetRaw = asset.source.toString();
				const assetPretty = await prettify( assetRaw );

				const magic = new MagicString( assetRaw );
				magic.update( 0, assetRaw.length, assetPretty );

				asset.source = magic.toString();

				return updateSourceMap( asset.fileName, magic );
			};

			for ( const file of Object.values( bundle ) ) {
				if ( !filter( file.fileName ) ) {
					continue;
				}

				if ( file.type === 'asset' ) {
					await updateAsset( file );
				}
			}
		}
	};
}

async function prettify( assetRaw: string ) {
	const cssDeclarationPattern = /(?<=(?:}|\/)\n)([^{]*?) {[\s\S]*?\n}\n/g;
	const rootSelectorValuesPattern = /(?<=:root {\n)[\s\S]*?(?=\n})/;
	const selectorPattern = /[^{]+/;

	const assetPretty = await prettier.format( assetRaw, {
		parser: 'css',
		useTabs: true,
		tabWidth: 4
	} );

	const declarations = assetPretty.match( cssDeclarationPattern ) || [];
	const declarationsSorted = declarations.sort( ( a, b ) => {
		const [ selectorA ] = a.match( selectorPattern )!;
		const [ selectorB ] = b.match( selectorPattern )!;

		const rootComparison = Number( isRootSelector( selectorB ) ) - Number( isRootSelector( selectorA ) );
		const mediaComparison = Number( isAtSelector( selectorA ) ) - Number( isAtSelector( selectorB ) );
		const textComparison = selectorA.localeCompare( selectorB );

		return rootComparison || mediaComparison || textComparison;
	} );

	const sortedDeclarations = assetPretty
	// Remove all declarations, and replace them with sorted ones.
	// The `TEMP` marker ensures that the new selectors land between
	// comments that were at the start and the end of the original file.
		.replace( cssDeclarationPattern, 'TEMP' )
		.replace( /(?:TEMP)+/, declarationsSorted.join( '\n' ) )

	// Merge all the `:root` selectors
		.replace( /}\n\n:root {\n/g, '' );

	const sortedRootSelectorValues = sortedDeclarations.match( rootSelectorValuesPattern )![ 0 ].split( ';\n' ).sort().join( ';\n' );

	return sortedDeclarations.replace( rootSelectorValuesPattern, sortedRootSelectorValues );
}

function isRootSelector( selector: string ): boolean {
	return selector.trim() === ':root';
}

function isAtSelector( selector: string ): boolean {
	return selector.startsWith( '@' );
}
