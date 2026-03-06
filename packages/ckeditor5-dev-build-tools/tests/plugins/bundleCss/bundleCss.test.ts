/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { test, expect } from 'vitest';
import { rollup, type RollupOutput, type OutputAsset, type OutputOptions, type Plugin } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { swcPlugin } from '../../_utils/utils.js';
import { bundleCss, type RollupBundleCssOptions } from '../../../src/index.js';

async function generateBundle(
	options: RollupBundleCssOptions,
	input: string = './fixtures/input.ts',
	plugins: Array<Plugin> = [],
	outputOptions: OutputOptions = {}
): Promise<RollupOutput[ 'output' ]> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, input ),
		plugins: [
			swcPlugin,
			...plugins,
			bundleCss( options )
		]
	} );

	const generateOptions: OutputOptions = {
		format: 'esm',
		assetFileNames: '[name][extname]',
		...outputOptions
	};

	if ( !generateOptions.file && !generateOptions.dir ) {
		generateOptions.file = 'input.js';
	}

	const { output } = await bundle.generate( generateOptions );

	return output;
}

function getAsset( output: RollupOutput[ 'output' ], fileName: string ): OutputAsset {
	const asset = output.find( output => output.fileName === fileName );

	expect( asset ).toBeDefined();
	expect( asset!.type ).toBe( 'asset' );

	return asset as OutputAsset;
}

test( 'Emits a single CSS bundle preserving import order', async () => {
	const output = await generateBundle( {
		fileName: 'styles.css'
	} );

	const stylesheet = getAsset( output, 'styles.css' ).source.toString();

	expect( stylesheet ).toContain( '.order-one' );
	expect( stylesheet ).toContain( '.order-two' );
	expect( stylesheet.indexOf( '.order-one' ) ).toBeLessThan( stylesheet.indexOf( '.order-two' ) );
	expect( output.filter( output => output.fileName.endsWith( '.css' ) ) ).toHaveLength( 1 );
} );

test( 'Allows minifying the generated bundle', async () => {
	const unminifiedOutput = await generateBundle( {
		fileName: 'styles.css'
	} );

	const minifiedOutput = await generateBundle( {
		fileName: 'styles.css',
		minify: true
	} );

	const unminifiedStylesheet = getAsset( unminifiedOutput, 'styles.css' ).source.toString();
	const minifiedStylesheet = getAsset( minifiedOutput, 'styles.css' ).source.toString();

	expect( minifiedStylesheet.length ).toBeLessThan( unminifiedStylesheet.length );
} );

test( 'Emits source map assets when enabled', async () => {
	const output = await generateBundle( {
		fileName: 'styles.css',
		sourceMap: true
	} );

	const stylesheet = getAsset( output, 'styles.css' ).source.toString();
	const sourceMapAsset = getAsset( output, 'styles.css.map' ).source.toString();
	const sourceMap = JSON.parse( sourceMapAsset ) as { sources: Array<string> };

	expect( stylesheet ).toContain( 'sourceMappingURL=styles.css.map' );
	expect( sourceMap.sources.some( source => source.endsWith( 'first.css' ) ) ).toBe( true );
	expect( sourceMap.sources.some( source => source.endsWith( 'second.css' ) ) ).toBe( true );
} );

test( 'Works with output.dir (without output.file)', async () => {
	const output = await generateBundle( {
		fileName: 'styles.css'
	}, './fixtures/input.ts', [], {
		dir: 'dist',
		preserveModules: true
	} );

	const stylesheet = getAsset( output, 'styles.css' ).source.toString();

	expect( stylesheet ).toContain( '.order-one' );
	expect( stylesheet ).toContain( '.order-two' );
} );

test( 'Uses transformed CSS code from previous plugins', async () => {
	const transformCssPlugin: Plugin = {
		name: 'transform-css-fixture',

		transform( code, id ) {
			if ( id.endsWith( 'first.css' ) ) {
				return `${ code }\n.transformed-by-plugin { color: green; }`;
			}
		}
	};

	const output = await generateBundle( {
		fileName: 'styles.css'
	}, './fixtures/input.ts', [ transformCssPlugin ] );

	const stylesheet = getAsset( output, 'styles.css' ).source.toString();

	expect( stylesheet ).toContain( '.transformed-by-plugin' );
} );

test( 'Resolves package CSS imports via Rollup resolution', async () => {
	const output = await generateBundle( {
		fileName: 'styles.css'
	}, './fixtures/input-package-import.ts', [
		nodeResolve( {
			extensions: [ '.ts', '.js', '.css' ],
			modulePaths: [ join( import.meta.dirname, './fixtures/packages' ) ]
		} )
	] );

	const stylesheet = getAsset( output, 'styles.css' ).source.toString();

	expect( stylesheet ).toContain( '.from-package' );
	expect( stylesheet ).toContain( '.package-import-local' );
} );

test( 'Emits Lightning CSS warnings through Rollup warnings', async () => {
	const warnings: Array<string> = [];

	const bundle = await rollup( {
		input: join( import.meta.dirname, './fixtures/input-warning.ts' ),
		onwarn( warning ) {
			warnings.push( warning.message );
		},
		plugins: [
			swcPlugin,
			bundleCss( {
				fileName: 'styles.css'
			} )
		]
	} );

	await bundle.generate( {
		format: 'esm',
		assetFileNames: '[name][extname]',
		file: 'input.js'
	} );

	expect( warnings.some( warning => warning.includes( 'Lightning CSS warning in' ) ) ).toBe( true );
	expect( warnings.some( warning => warning.includes( 'Unknown at rule: @unknown' ) ) ).toBe( true );
	expect( warnings.some( warning => warning.includes( 'warning.css' ) ) ).toBe( true );
} );

test( 'Throws when encountering external CSS imports', async () => {
	await expect( generateBundle( {
		fileName: 'styles.css'
	}, './fixtures/input-external-import.ts' ) ).rejects.toThrow( 'External CSS imports are not supported' );
} );
