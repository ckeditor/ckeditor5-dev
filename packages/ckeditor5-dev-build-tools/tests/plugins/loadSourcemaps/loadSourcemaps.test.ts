/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { test, expect } from 'vitest';
import { rollup, type RollupOutput, type OutputAsset } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { swcPlugin } from '../../_utils/utils.js';

import { loadSourcemaps } from '../../../src/index.js';
import { getOptionalPlugin } from '../../../src/utils.js';

async function generateBundle( input: string, sourcemap: boolean = false ): Promise<RollupOutput[ 'output' ]> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, input ),
		plugins: [
			nodeResolve(),
			swcPlugin,
			getOptionalPlugin( sourcemap, loadSourcemaps() )
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

test( 'Emits source maps combined with source maps of dependencies', async () => {
	const output = await generateBundle( './fixtures/input.ts', true );
	const sourceMap = output.find( asset => asset.fileName === 'input.js.map' ) as OutputAsset;

	/**
	 * The resulting source map will only contain the `/magic-string/src/` string if the source map
	 * of the `magic-string` dependency was loaded and combined with the source map of the input file.
	 * Otherwise, the source map will contain the `/magic-string/dist/` string, which is the bundled
	 * build of the `magic-string` dependency.
	 */
	expect( sourceMap.source ).toContain( '/magic-string/src/' );
} );
