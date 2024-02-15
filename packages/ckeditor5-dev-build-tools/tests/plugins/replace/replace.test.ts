/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { expect, test } from 'vitest';
import { rollup, type RollupOutput, type OutputAsset } from 'rollup';
import { verifyChunk } from '../../_utils/utils.js';

import { replace, type RollupReplaceOptions } from '../../../src/index.js';

async function generateBundle(
	options: RollupReplaceOptions,
	sourcemap?: boolean
): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.js' ),
		plugins: [
			replace( options )
		]
	} );

	const { output } = await bundle.generate( { format: 'esm', sourcemap } );

	return output;
}

test( 'Doesnt replace anything by default', async () => {
	const output = await generateBundle( { replace: [] } );

	verifyChunk( output, 'input.js', 'const test = 123;' );
} );

test( 'Accepts string', async () => {
	const output = await generateBundle( {
		replace: [
			[ 'test', 'temp' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const temp = 123;' );
} );

test( 'Accepts RegExp', async () => {
	const output = await generateBundle( {
		replace: [
			[ /test/g, 'temp' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const temp = 123;' );
} );

test( 'Accepts string and RegExp', async () => {
	const output = await generateBundle( {
		replace: [
			[ 'test', 'temp' ],
			[ /123/g, '456' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const temp = 456;' );
} );

test( 'Updates the source map', async () => {
	const unmodifiedOutput = await generateBundle( {
		replace: [],
		sourceMap: true
	}, true );

	const output = await generateBundle( {
		replace: [
			[ 'test', 'temp' ],
			[ /123/g, '456' ]
		],
		sourceMap: true
	}, true );

	expect( ( unmodifiedOutput[ 1 ] as OutputAsset ).source ).not.toBe( ( output[ 1 ] as OutputAsset ).source );
	verifyChunk( output, 'input.js', 'const temp = 456;' );
} );

test( 'Replacing happens after the code is parsed and tree-shaken', async () => {
	const output = await generateBundle( {
		replace: [
			[ './dependency.js', './non-existing-file.js' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const test = 123;' );
} );
