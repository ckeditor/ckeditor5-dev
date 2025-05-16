/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect, vi, beforeEach } from 'vitest';
import upath from 'upath';
import * as Rollup from 'rollup';
import { readFileSync } from 'fs';
import { build } from '../../src/build.js';
import { mockGetUserDependency } from '../_utils/utils.js';

/**
 * Mock `rollup` to replace `rollup.write` with `rollup.generate`.
 */
vi.mock( 'rollup', () => ( {
	async rollup( rollupOptions: Rollup.RollupOptions ) {
		const { rollup } = await vi.importActual<typeof Rollup>( 'rollup' );
		const build = await rollup( rollupOptions );

		return {
			write: build.generate
		};
	}
} ) );

/**
 * Mocks Rollup.
 */
function setRollupMock( mock: any ) {
	vi.spyOn( Rollup, 'rollup' ).mockImplementationOnce( mock );
}

/**
 * Mocks `process.cwd` to return the fixtures directory.
 */
function setProcessCwdMock() {
	vi.spyOn( process, 'cwd' ).mockImplementation( () => upath.join( import.meta.dirname, 'fixtures' ) );
}

/**
 * Mock `core` dependencies.
 */

async function mockCoreDependencies() {
	await mockGetUserDependency(
		'ckeditor5/package.json',
		() => ( {
			name: 'ckeditor5',
			dependencies: {
				'@ckeditor/ckeditor5-core': '*'
			}
		} )
	);
}

/**
 * Mock `commercial` dependencies.
 */

async function mockCommercialDependencies() {
	await mockGetUserDependency(
		'ckeditor5-premium-features/package.json',
		() => ( {
			name: 'ckeditor5-premium-features',
			dependencies: {
				'@ckeditor/ckeditor5-ai': '*',
				'ckeditor5-collaboration': '*'
			}
		} )
	);
}

// eslint-disable-next-line mocha/no-top-level-hooks
beforeEach( () => {
	setProcessCwdMock();
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
		'input.d.ts'
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

test( 'Browser parameter set to `true` and name parameter not set', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		browser: true
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css'
	] );
} );

test( 'Browser parameter set to `true` and name parameter set', async () => {
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

test( 'Custom output name', async () => {
	const { output } = await build( {
		input: 'src/input.ts',

		/**
		 * Because we mocked rollup to use `rollup.generate` instead of `rollup.write`, the output of the
		 * first ESM build is not saved to the disk, so the UMD build cannot be based on it. That's why the
		 * `output` filename matches the `input` filename. However, because the default output name is `index`,
		 * this is still a valid test.
		 */
		output: 'src/input.js',
		tsconfig: 'tsconfig.json',
		browser: true,
		name: 'custom'
	} );

	expect( output.map( o => o.fileName ) ).toMatchObject( [
		'input.js',
		'input.css',
		'input-editor.css',
		'input-content.css',
		'input.umd.js'
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
		'translations/en.umd.js',
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

test( 'Minification doesn\'t remove banner', async () => {
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
	await mockGetUserDependency(
		'ckeditor5/package.json',
		() => ( {
			name: 'ckeditor5',
			dependencies: {
				'@ckeditor/ckeditor5-utils': '*'
			}
		} )
	);

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
	setRollupMock( () => ( {
		write() {
			throw new Error( 'REASON' );
		}
	} ) );

	const fn = () => build( { input: 'src/input.js' } );

	await expect( fn ).rejects.toThrow( /The build process failed with the following error(.*)REASON/s );
} );

test( 'Throws Rollup error with nicely formatter message when build fails', async () => {
	setRollupMock( () => ( {
		write() {
			const err = new Error() as any;

			err.name = 'RollupError';
			err.id = 'FILENAME';
			err.message = 'REASON';

			throw err;
		}
	} ) );

	const fn = () => build( { input: 'src/input.js' } );

	await expect( fn ).rejects.toThrow( /Error occurred when processing the file(.*)FILENAME(.*)REASON/s );
} );

test( 'Rollup error includes frame if provided', async () => {
	setRollupMock( () => ( {
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

	await expect( fn ).rejects.toThrow( /Error occurred when processing the file(.*)FRAME/s );
} );

/**
 * Mocking real CKE5 packages and test the `Replace' plugin.
 */

test( 'Replace - export from core (browser = false)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'data-for-rewrites-tests', 'export-from-core.js' ), 'utf-8' );

	await mockCoreDependencies();

	const { output } = await build( {
		input: 'data-for-rewrites-tests/export-from-core.js',
		external: [
			'ckeditor5'
		]
	} );

	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-core\'' );
	expect( output[ 0 ].code ).toContain( 'export * from \'@ckeditor/ckeditor5-core/dist/index.js\'' );
} );

test( 'Replace - export from commercial (browser = false)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'data-for-rewrites-tests', 'export-from-commercial.js' ), 'utf-8' );

	await mockCoreDependencies();
	await mockCommercialDependencies();

	const { output } = await build( {
		input: 'data-for-rewrites-tests/export-from-commercial.js',
		external: [
			'ckeditor5',
			'ckeditor5-premium-features'
		]
	} );

	expect( inputFileContent ).toContain( 'export * from \'@ckeditor/ckeditor5-ai\'' );
	expect( output[ 0 ].code ).toContain( 'export * from \'@ckeditor/ckeditor5-ai/dist/index.js\'' );
} );

test( 'Replace - import from core (browser = true)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'data-for-rewrites-tests', 'import-from-core.js' ), 'utf-8' );

	await mockCoreDependencies();

	const { output } = await build( {
		input: 'data-for-rewrites-tests/import-from-core.js',
		external: [
			'ckeditor5'
		],
		browser: true,
		name: 'ckeditor5-premium-features'
	} );

	expect( inputFileContent ).toContain( 'import { Plugin } from \'ckeditor5/src/core.js\'' );
	expect( output[ 0 ].code ).toContain( 'import { Plugin } from \'ckeditor5\'' );
} );

test( 'Replace - import from core and from commercial (browser = true)', async () => {
	const inputFileContent = readFileSync( upath.join( process.cwd(), 'data-for-rewrites-tests', 'import-from-both.js' ), 'utf-8' );

	await mockCoreDependencies();
	await mockCommercialDependencies();

	const { output } = await build( {
		input: 'data-for-rewrites-tests/import-from-both.js',
		external: [
			'ckeditor5',
			'ckeditor5-premium-features'
		],
		browser: true,
		name: 'ckeditor5-premium-features'
	} );

	expect( inputFileContent ).toContain( 'import { Plugin } from \'ckeditor5/src/core.js\'' );
	expect( output[ 0 ].code ).toContain( 'import { Plugin } from \'ckeditor5\'' );

	expect( inputFileContent ).toContain( 'import { Command } from \'@ckeditor/ckeditor5-core\'' );
	expect( output[ 0 ].code ).toContain( 'import { Plugin } from \'ckeditor5\'' );

	expect( inputFileContent ).toContain( 'import { AIAssistant } from \'@ckeditor/ckeditor5-ai\'' );
	expect( output[ 0 ].code ).toContain( 'import { AIAssistant } from \'ckeditor5-premium-features\'' );

	expect( inputFileContent ).toContain( 'import { Users } from \'ckeditor5-collaboration/src/collaboration-core.js\'' );
	expect( output[ 0 ].code ).toContain( 'import { Users } from \'ckeditor5-premium-features\'' );
} );
