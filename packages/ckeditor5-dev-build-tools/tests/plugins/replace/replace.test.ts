/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { expect, test } from 'vitest';
import { rollup, type RollupOutput, type OutputAsset } from 'rollup';
import { verifyChunk } from '../../_utils/utils.js';

import { replaceImports, type RollupReplaceOptions } from '../../../src/index.js';

async function generateBundle(
	options: RollupReplaceOptions,
	sourcemap?: boolean
): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.js' ),
		external: [
			'fs'
		],
		plugins: [
			replaceImports( options )
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js',
		sourcemap
	} );

	return output;
}

test( 'Doesnt replace anything by default', async () => {
	const output = await generateBundle( { replace: [] } );

	verifyChunk( output, 'input.js', 'const test = 123;' );
} );

test( 'Accepts string', async () => {
	const output = await generateBundle( {
		replace: [
			[ 'fs', 'another-dependency' ]
		]
	} );

	verifyChunk( output, 'input.js', 'export * from \'another-dependency\';' );
} );

test( 'Accepts RegExp', async () => {
	const output = await generateBundle( {
		replace: [
			[ /fs/, 'another-dependency' ]
		]
	} );

	verifyChunk( output, 'input.js', 'export * from \'another-dependency\';' );
} );

test( 'Updates the source map', async () => {
	const unmodifiedOutput = await generateBundle( {
		replace: []
	}, true );

	const output = await generateBundle( {
		replace: [
			[ 'fs', 'another-dependency' ]
		]
	}, true );

	expect( ( unmodifiedOutput[ 1 ] as OutputAsset ).source ).not.toBe( ( output[ 1 ] as OutputAsset ).source );
	verifyChunk( output, 'input.js', 'another-dependency' );
} );

test( 'Replacing happens after the code is parsed and tree-shaken', async () => {
	const output = await generateBundle( {
		replace: [
			[ './dependency.js', 'fs' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const test = 123;' );
} );
