/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { test } from 'vitest';
import styles from 'rollup-plugin-styles';
import { rollup, type RollupOutput } from 'rollup';
import { swcPlugin, verifyAsset } from '../../_utils/utils.js';

import { emitCss } from '../../../src/index.js';

async function generateBundle( input: string ): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, input ),
		plugins: [
			swcPlugin,

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			styles( {
				mode: [
					'extract',
					'styles.css'
				]
			} ),

			emitCss( {
				fileNames: [ 'styles.css' ]
			} )
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js',
		assetFileNames: '[name][extname]'
	} );

	return output;
}

test( 'Emits file if it wasn\'t already', async () => {
	const output = await generateBundle( './fixtures/input.ts' );

	verifyAsset( output, 'styles.css', '' );
} );

test( 'Doesn\'t override file if it was emitted', async () => {
	const output = await generateBundle( './fixtures/input-css.ts' );

	verifyAsset( output, 'styles.css', 'div' );
} );
