/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { test, expect, vi } from 'vitest';
import styles from 'rollup-plugin-styles';
import { rollup, type RollupOutput, type OutputAsset } from 'rollup';
import { swcPlugin, verifyAsset, verifyChunk } from '../../_utils/utils.js';
import { addBanner, type RollupBannerOptions } from '../../../src/index.js';

const createFilterSpy = vi.hoisted( vi.fn );

vi.mock( '@rollup/pluginutils', async importOriginal => {
	const original = await importOriginal() as any;

	return {
		...original,
		createFilter: ( ...args: any ) => {
			createFilterSpy( ...args );
			return original.createFilter( ...args );
		}
	};
} );

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle( options: RollupBannerOptions, sourcemap: boolean = false ): Promise<RollupOutput[ 'output' ]> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.ts' ),
		plugins: [
			swcPlugin,

			styles( {
				mode: [
					'extract',
					'styles.css'
				]
			} ),

			addBanner( options )
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

test( 'Should have proper default values', async () => {
	const banner = '/* CUSTOM BANNER */';
	await generateBundle( { banner } );

	expect( createFilterSpy ).toHaveBeenCalledExactlyOnceWith(
		[
			'**/*.js',
			'**/*.css',
			'**/translations/**/*.d.ts'
		],
		null
	);
} );
