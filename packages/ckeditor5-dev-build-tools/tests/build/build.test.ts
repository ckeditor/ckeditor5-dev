import { test, expect, beforeEach, vi } from 'vitest';
import * as rollup from 'rollup';
import { build } from '../../src/build.js';

const rp = rollup.rollup;

/**
 * Mock `process.cwd()` to point to the 'fixtures' directory.
 */
vi
	.spyOn( process, 'cwd' )
	.mockImplementation( () => import.meta.dirname + '/fixtures' );

/**
 * Mock `rollup.write` to run `rollup.generate` instead. This
 * will prevent Rollup from writing to filesystem.
 */
vi
	.spyOn( rollup, 'rollup' )
	.mockImplementation( async ( options ) => {
		const bundle = await rp( options );

		return {
			write: bundle.generate
		} as any;
	} );

// TODO: Is this needed?
beforeEach( () => {
	vi.clearAllMocks();
} );

/**
 * Input
 */
test( 'JavaScript input', async () => {
	const { output } = await build( {
		input: 'src/input.js'
	} );

	expect( output[0].code ).exist;
} );

test( 'TypeScript input', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json'
	} );

	expect( output[0].code ).not.contain( 'TestType' );
} );

/**
 * Banner
 */

test( 'Banner', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		banner: 'src/banner.js'
	} );

	expect( output[0].code ).toMatch( /^\/\/ TEST BANNER/ );
} );

/**
 * Externals
 */
test( 'No externals', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: []
	} );

	expect( output[0].code ).not.toContain( 'chalk' );
} );

test( 'Externals', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: [ 'chalk' ]
	} );

	expect( output[0].code ).toContain( 'chalk' );
} );

// TODO: Browser?

/**
 * Translations
 */
test( 'No translations', async () => {
	const { output } = await build( {
		input: 'src/input.js',
	} );

	// `index.js`,`types/index.d.ts`, and `styles.css`.
	expect( output ).lengthOf( 3 );
} );

test( 'Translations', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		translations: true
	} );

	// `index.js`, `types/index.d.ts`, `styles.css`, and `translations/en.js`
	expect( output ).lengthOf( 4 );
	expect( ( output[1] as rollup.OutputChunk).code ).toContain( 'Hello world' );
} );

/**
 * Source map
 */
test( 'Source map', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		sourceMap: true
	} );

	// `index.js`, `types/index.d.ts`, `styles.css`, `index.js.map` and `styles.css.map`.
	expect( output ).lengthOf( 5 );
} );

/**
 * Bundle
 */
test( 'Bundle', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		bundle: true
	} );

	expect( output[0].code ).not.toContain( 'chalk' );
} );

/**
 * Minify
 */
test( 'Minify', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		minify: true
	} );

	expect( output[0].code ).toContain( 'export{colors}from"chalk"' );
} );

test.only( 'Minify doesnt remove comments starting with !', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		minify: true,
		banner: 'src/banner.js'
	} );

	console.log( output[0].code );

	expect( output[0].code ).toContain( 'TEST BANNER' );
} );

/**
 * Overriding
 */
test( 'Overriding', async () => {
	const { output } = await build( {
		input: 'src/overriding.js'
	} );

	expect( output[0].code ).toContain( '@ckeditor/ckeditor5-utils/dist/index.js' );
} );
