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
		'styles.css',
		'editor-styles.css',
		'content-styles.css'
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
		'styles.css',
		'editor-styles.css',
		'content-styles.css',
		'types/input.d.ts'
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
test( 'No translations', async () => {
	const { output } = await build( {
		input: 'src/input.js'
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'editor-styles.css',
		'content-styles.css',
		'styles.css'
	] );
} );

test( 'Translations', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		translations: true
	} );

	expect( ( output[ 1 ] as rollup.OutputChunk ).code ).toContain( 'Hello world' );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'translations/en.js',
		'styles.css',
		'editor-styles.css',
		'content-styles.css'
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
		'styles.css',
		'styles.css.map',
		'editor-styles.css',
		'content-styles.css'
	] );
} );

/**
 * Bundle
 */
test( 'Bundle', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		bundle: true
	} );

	expect( output[ 0 ].code ).not.toContain( 'chalk' );
} );

/**
 * Minify
 */
test( 'Minify', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		minify: true
	} );

	expect( output[ 0 ].code ).toContain( 'export{colors}from"chalk";' );
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
		input: 'src/overriding.ts'
	} );

	expect( output[ 0 ].code ).toContain( '@ckeditor/ckeditor5-utils/dist/index.js' );
} );
