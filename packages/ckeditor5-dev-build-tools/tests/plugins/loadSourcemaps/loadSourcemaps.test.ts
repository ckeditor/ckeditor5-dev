/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { test, expect } from 'vitest';
import { rolldown, type RolldownOutput, type OutputAsset } from 'rolldown';

import { loadSourcemaps } from '../../../src/index.js';
import { getOptionalPlugin } from '../../../src/utils.js';

async function generateBundle( input: string, sourcemap: boolean = false ): Promise<RolldownOutput[ 'output' ]> {
	const bundle = await rolldown( {
		input: join( import.meta.dirname, input ),
		plugins: [
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
	 * The resulting source map will only contain the `dependency.ts` string if the source map
	 * of the `dependency.js` fixture was loaded and combined with the source map of the input file.
	 */
	expect( sourceMap.source ).toContain( 'dependency.ts' );
} );
