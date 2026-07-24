/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { test, expect } from 'vitest';
import { rolldown, type PluginContext, type RolldownOutput } from 'rolldown';
import { verifyChunk } from '../../_utils/utils.js';

import { rawImport } from '../../../src/index.js';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle(): Promise<RolldownOutput['output']> {
	const bundle = await rolldown( {
		input: upath.join( import.meta.dirname, '/fixtures/input.js' ),
		plugins: [
			rawImport()
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js'
	} );

	return output;
}

test( 'can import raw file content using the `?raw` query parameter', async () => {
	const output = await generateBundle();

	// Content from `dependency.css` file.
	verifyChunk( output, 'input.js', 'color: hsl(0deg 100% 50%);' );

	// Content from `dependency.js` file.
	verifyChunk( output, 'input.js', 'const test = 123;' );

	// Content from `dependency.txt` file.
	verifyChunk( output, 'input.js', 'Hello World!' );
} );

test( 'does not resolve raw imports without importer context', () => {
	const plugin = rawImport();
	const resolveId = typeof plugin.resolveId == 'function' ? plugin.resolveId : plugin.resolveId!.handler;

	expect( resolveId.call( {} as PluginContext, './dependency.css?raw', undefined, {} as any ) ).toBeNull();
} );
