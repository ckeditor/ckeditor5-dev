/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { test } from 'vitest';
import { rollup, type RollupOutput } from 'rollup';
import { swcPlugin, verifyChunk } from '../../_utils/utils.js';

import { loadTypeScriptSources } from '../../../src/index.js';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle( enabled = true ): Promise<RollupOutput[ 'output' ]> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.ts' ),
		plugins: [
			swcPlugin,

			enabled && loadTypeScriptSources()
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js',
		assetFileNames: '[name][extname]'
	} );

	return output;
}

test( 'Prioritizes `.ts` files over `.js` files', async () => {
	const output = await generateBundle();

	verifyChunk( output, 'input.js', '123' );
} );

test( 'When not enabled, prioritizes `.js` files over `.ts` files', async () => {
	const output = await generateBundle( false );

	verifyChunk( output, 'input.js', '456' );
} );

