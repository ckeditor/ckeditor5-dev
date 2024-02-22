/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { test, expect } from 'vitest';
import styles from 'rollup-plugin-styles';
import typescript from '@rollup/plugin-typescript';
import { rollup, type RollupOutput, type OutputAsset } from 'rollup';
import { verifyAsset, verifyChunk } from '../../_utils/utils.js';

import { banner, type RollupBannerOptions } from '../../../src/index.js';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle( options: RollupBannerOptions, sourcemap: boolean = false ): Promise<RollupOutput[ 'output' ]> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.ts' ),
		plugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			typescript( {
				tsconfig: join( import.meta.dirname, './fixtures/tsconfig.json' )
			} ),

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			styles( {
				mode: [
					'extract',
					'styles.css'
				]
			} ),

			banner( options )
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js',
		assetFileNames: '[name][extname]',
		sourcemap
	} );

	return output;
}

test( 'Adds banner to .js and .css files by default', async () => {
	const banner = '/* CUSTOM BANNER */';
	const output = await generateBundle( { banner } );

	verifyChunk( output, 'input.js', banner );
	verifyAsset( output, 'styles.css', banner );
} );

test( 'Updates the source map', async () => {
	const unmodifiedOutput = await generateBundle( { banner: '' }, true );
	const banner = '/* CUSTOM BANNER */\n';
	const output = await generateBundle( { banner }, true );

	expect( ( unmodifiedOutput[ 1 ] as OutputAsset ).source ).not.toBe( ( output[ 1 ] as OutputAsset ).source );

	verifyChunk( output, 'input.js', banner );
	verifyAsset( output, 'styles.css', banner );
} );

test( 'Allows overriding "include" option', async () => {
	const banner = '/* CUSTOM BANNER */';
	const output = await generateBundle( {
		banner,
		include: [ '**/*.css' ]
	} );

	expect( output[ 0 ].code ).not.includes( banner );
	verifyAsset( output, 'styles.css', banner );
} );

test( 'Allows overriding "exclude" option', async () => {
	const banner = '/* CUSTOM BANNER */';
	const output = await generateBundle( {
		banner,
		exclude: [ '**/*.js' ]
	} );

	expect( output[ 0 ].code ).not.includes( banner );
	verifyAsset( output, 'styles.css', banner );
} );
