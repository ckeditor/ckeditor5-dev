/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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
	.mockImplementation( async options => {
		const bundle = await rp( options );

		return {
			write: bundle.generate
		} as any;
	} );

// eslint-disable-next-line mocha/no-top-level-hooks
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

	expect( output[ 0 ].code ).exist;
} );

test( 'TypeScript input', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json'
	} );

	expect( output[ 0 ].code ).not.contain( 'TestType' );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'editor-index.css',
		'content-index.css'
	] );
} );

test( 'TypeScript declarations', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		declarations: true
	} );

	expect( output[ 0 ].code ).not.contain( 'TestType' );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'editor-index.css',
		'content-index.css',
		'types/input.d.ts'
	] );
} );

/**
 * Format
 */
test( 'Format esm', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		format: 'esm'
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'editor-index.css',
		'content-index.css'
	] );
} );

test( 'Format umd', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		format: 'umd',
		outputName: 'EXAMPLE_OUTPUT_NAME'
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'editor-index.css',
		'content-index.css'
	] );
} );

/**
 * Output Name
 */
test( 'Output name', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		format: 'umd',
		outputName: 'EXAMPLE_OUTPUT_NAME'
	} );

	expect( output[ 0 ].code ).toContain( 'EXAMPLE_OUTPUT_NAME' );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'editor-index.css',
		'content-index.css'
	] );
} );

/**
 * Banner
 */
test( 'Banner', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		banner: 'src/banner.js'
	} );

	expect( output[ 0 ].code ).toMatch( /^\/\*! TEST BANNER \*\// );
} );

/**
 * Externals
 */
test( 'No externals', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: []
	} );

	expect( output[ 0 ].code ).not.toContain( 'chalk' );
} );

test( 'Externals', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: [ 'chalk' ]
	} );

	expect( output[ 0 ].code ).toContain( 'chalk' );
} );

/**
 * Translations
 */
test( 'Translations', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		translations: '**/*.po'
	} );

	expect( ( output[ 1 ] as rollup.OutputChunk ).code ).toContain( 'Hello world' );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'translations/en.js',
		'translations/en.d.ts',
		'index.css',
		'editor-index.css',
		'content-index.css'
	] );
} );

/**
 * Source map
 */
test( 'Source map', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		sourceMap: true
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.js.map',
		'index.css',
		'index.css.map',
		'editor-index.css',
		'content-index.css'
	] );
} );

/**
 * Bundle
 */
test( 'Bundle', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: []
	} );

	expect( output[ 0 ].code ).not.toContain( 'chalk' );
} );

/**
 * Minify
 */
test( 'Minify', async () => {
	const { output } = await build( {
		input: 'src/banner.js',
		minify: true
	} );

	expect( output[ 0 ].code ).toContain( 'export{' );
} );

test( 'Minification doesnt remove banner', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		banner: 'src/banner.js',
		minify: true
	} );

	expect( output[ 0 ].code ).toContain( 'TEST BANNER' );
} );

/**
 * Overriding
 */
test( 'Overriding', async () => {
	const { output } = await build( {
		input: 'src/overriding.js',
		external: [
			'ckeditor5'
		]
	} );

	expect( output[ 0 ].code ).toContain( 'ckeditor5' );
} );

/**
 * Error handling
 */
test( 'Throws error with nicely formatter message when build fails', async () => {
	vi
		.spyOn( rollup, 'rollup' )
		.mockImplementationOnce( (): any => ( {
			write() {
				throw new Error( 'REASON' );
			}
		} ) );

	const fn = () => build( { input: 'src/input.js' } );

	expect( fn ).rejects.toThrow( /The build process failed with the following error(.*)REASON/s );
} );

test( 'Throws Rollup error with nicely formatter message when build fails', async () => {
	vi
		.spyOn( rollup, 'rollup' )
		.mockImplementationOnce( (): any => ( {
			write() {
				const err = new Error() as any;

				err.name = 'RollupError';
				err.id = 'FILENAME';
				err.message = 'REASON';

				throw err;
			}
		} ) );

	const fn = () => build( { input: 'src/input.js' } );

	expect( fn ).rejects.toThrow( /Error occured when processing the file(.*)FILENAME(.*)REASON/s );
} );

test( 'Rollup error includes frame if provided', async () => {
	vi
		.spyOn( rollup, 'rollup' )
		.mockImplementationOnce( (): any => ( {
			write() {
				const err = new Error() as any;

				err.name = 'RollupError';
				err.id = 'FILENAME';
				err.message = 'REASON';
				err.frame = 'FRAME';

				throw err;
			}
		} ) );

	const fn = () => build( { input: 'src/input.js' } );

	expect( fn ).rejects.toThrow( /Error occured when processing the file(.*)FRAME/s );
} );
