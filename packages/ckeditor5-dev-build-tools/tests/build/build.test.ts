/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect, vi } from 'vitest';
import type * as Rollup from 'rollup';
import { readFileSync } from 'fs';
import upath from 'upath';
import { build } from '../../src/build.js';

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
const mocks = vi.hoisted( () => ( {
	rollup: vi.fn().mockImplementation( async ( rollupOptions: Rollup.RollupOptions ) => {
		const { rollup } = await vi.importActual<typeof Rollup>( 'rollup' );
		const build = await rollup( rollupOptions );

		return {
			write: build.generate
		};
	} )
} ) );

vi.mock( 'rollup', () => ( {
	rollup: mocks.rollup
} ) );

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
		'index-editor.css',
		'index-content.css'
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
		'index-editor.css',
		'index-content.css',
		'types/input.d.ts'
	] );
} );

/**
 * Browser
 */
test( 'Browser parameter set to `false`', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		browser: false
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css'
	] );
} );

test( 'Browser parameter set to `true`', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		browser: true,
		name: 'EXAMPLE_OUTPUT_NAME'
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css',
		'index.umd.js'
	] );
} );

/**
 * Output Name
 */
test( 'Output name', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		browser: true,
		name: 'EXAMPLE_OUTPUT_NAME'
	} );

	let code;

	output.forEach( item => {
		if ( item.type === 'chunk' && item.fileName === 'index.umd.js' ) {
			code = item.code;
		}
	} );

	if ( code ) {
		expect( code ).toContain( 'EXAMPLE_OUTPUT_NAME' );
	}

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css',
		'index.umd.js'
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

	expect( ( output[ 1 ] as Rollup.OutputChunk ).code ).toContain( 'Hello world' );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'translations/en.js',
		'translations/en.d.ts',
		'index.css',
		'index-editor.css',
		'index-content.css'
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
		'index-editor.css',
		'index-content.css'
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
	mocks.rollup.mockImplementationOnce( () => ( {
		write() {
			throw new Error( 'REASON' );
		}
	} ) );

	const fn = () => build( { input: 'src/input.js' } );

	expect( fn ).rejects.toThrow( /The build process failed with the following error(.*)REASON/s );
} );

test( 'Throws Rollup error with nicely formatter message when build fails', async () => {
	mocks.rollup.mockImplementationOnce( () => ( {
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
	mocks.rollup.mockImplementationOnce( () => ( {
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

/**
 * Mock real CKE5 packages and test the replace plugin.
 */

test( 'Bundle core (NPM)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'src', 'core.ts' ), 'utf-8' );

	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-adapter-ckfinder\'' );
	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-core\'' );

	const { output } = await build( {
		input: 'src/core.ts',
		external: [
			'ckeditor5'
		]
	} );

	expect( output[ 0 ].code ).toContain( 'export * from \'@ckeditor/ckeditor5-adapter-ckfinder/dist/index.js\'' );
	expect( output[ 0 ].code ).toContain( 'export * from \'@ckeditor/ckeditor5-core/dist/index.js\'' );
} );

test( 'Bundle commercial (NPM)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'src', 'commercial.ts' ), 'utf-8' );

	// expect( inputFileContent ).toContain( 'export { Permissions } from \'ckeditor5-collaboration/src/index.js\'' );
	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-ai\'' );
	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-case-change\'' );

	const { output } = await build( {
		input: 'src/commercial.ts',
		external: [
			'ckeditor5',
			'ckeditor5-premium-features'
		]
	} );

	// expect( output[ 0 ].code ).toContain( 'export { Permissions } from \'ckeditor5-collaboration/dist/index.js\'' );
	expect( output[ 0 ].code ).toContain( 'export * from \'@ckeditor/ckeditor5-ai/dist/index.js\'' );
	expect( output[ 0 ].code ).toContain( 'export * from \'@ckeditor/ckeditor5-case-change/dist/index.js\'' );
} );

test( 'Bundle commercial (CDN)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'src', 'commercial.ts' ), 'utf-8' );

	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-ai\'' );
	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-case-change\'' );

	const { output } = await build( {
		input: 'src/commercial.ts',
		external: [
			'ckeditor5'
		],
		browser: true,
		name: 'ckeditor5-premium-features'
	} );

	expect( output[ 0 ].code ).toContain( ' from \'ckeditor5\';' );
} );
