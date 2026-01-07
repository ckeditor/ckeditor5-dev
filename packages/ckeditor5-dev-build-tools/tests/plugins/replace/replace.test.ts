/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
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
			'node:fs'
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
			[ 'node:fs', 'another-dependency' ]
		]
	} );

	verifyChunk( output, 'input.js', 'export * from \'another-dependency\';' );
} );

test( 'Accepts RegExp', async () => {
	const output = await generateBundle( {
		replace: [
			[ /node:fs/, 'another-dependency' ]
		]
	} );

	verifyChunk( output, 'input.js', 'export * from \'another-dependency\';' );
} );

test( 'Replaces import BEFORE bundling when 3rd parameter is set to true', async () => {
	const output = await generateBundle( {
		replace: [
			[ './dependency.js', './replaced-dependency.js', true ]
		]
	} );

	verifyChunk( output, 'input.js', 'const test = 456;' );
} );

test( 'Updates the source map', async () => {
	const unmodifiedOutput = await generateBundle( {
		replace: []
	}, true );

	const output = await generateBundle( {
		replace: [
			[ 'node:fs', 'another-dependency' ]
		]
	}, true );

	expect( ( unmodifiedOutput[ 1 ] as OutputAsset ).source ).not.toBe( ( output[ 1 ] as OutputAsset ).source );
	verifyChunk( output, 'input.js', 'another-dependency' );
} );

test( 'Updates the source map when 3rd parameter is set to true', async () => {
	const unmodifiedOutput = await generateBundle( {
		replace: []
	}, true );

	const output = await generateBundle( {
		replace: [
			[ './dependency.js', './replaced-dependency.js', true ]
		]
	}, true );

	expect( ( unmodifiedOutput[ 1 ] as OutputAsset ).source ).not.toBe( ( output[ 1 ] as OutputAsset ).source );
	verifyChunk( output, 'input.js', 'const test = 456;' );
} );

test( 'Replacing happens after the code is parsed and tree-shaken', async () => {
	const output = await generateBundle( {
		replace: [
			[ './dependency.js', 'node:fs' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const test = 123;' );
} );
