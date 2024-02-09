/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { test } from 'vitest';
import terser from '@rollup/plugin-terser';
import { rollup, type RollupOutput } from 'rollup';
import { verifyAsset, verifyChunk } from '../../_test-utils/utils.js';

import { replace, type RollupReplaceOptions } from '../../../src/index.js';

async function generateBundle(
	options: RollupReplaceOptions,
	sourcemap?: boolean
): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input.js' ),
		plugins: [
			replace( options ),

			// Terser is used to minify the output, so it's easier to compare.
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			terser( {
				mangle: false
			} )
		]
	} );

	const { output } = await bundle.generate( { format: 'esm', sourcemap } );

	return output;
}

test( 'Doesnt replace anything by default', async () => {
	const output = await generateBundle( { replace: [] } );

	verifyChunk( output, 'input.js', 'const test=123;export{test};\n' );
} );

test( 'Accepts string', async () => {
	const output = await generateBundle( {
		replace: [
			[ 'test', 'temp' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const temp=123;export{temp};\n' );
} );

test( 'Accepts RegExp', async () => {
	const output = await generateBundle( {
		replace: [
			[ /test/g, 'temp' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const temp=123;export{temp};\n' );
} );

test( 'Accepts string and RegExp', async () => {
	const output = await generateBundle( {
		replace: [
			[ 'test', 'temp' ],
			[ /123/g, '456' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const temp=456;export{temp};\n' );
} );

test( 'Plugin generates a source map', async () => {
	const output = await generateBundle( {
		replace: [
			[ 'test', 'temp' ],
			[ /123/g, '456' ]
		],
		sourceMap: true
	}, true );

	verifyAsset( output, 'input.js.map', '"names":["temp"]' );
	verifyChunk( output, 'input.js', 'const temp=456;export{temp};\n' );
} );

test( 'Replacing happens after the code is parsed and tree-shaken', async () => {
	const output = await generateBundle( {
		replace: [
			[ './dependency.js', './non-existing-file.js' ]
		]
	} );

	verifyChunk( output, 'input.js', 'const test=123;export{test};\n' );
} );
