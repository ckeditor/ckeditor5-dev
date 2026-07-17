/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect, vi, beforeEach } from 'vitest';
import upath from 'upath';
import * as Rolldown from 'rolldown';
import { SourceMapConsumer } from 'source-map';
import { build } from '../../src/build.js';
import { mockGetUserDependency } from '../_utils/utils.js';

/**
 * Mock `rolldown` to replace `rolldown.write` with `rolldown.generate`.
 */
vi.mock( 'rolldown', async () => {
	const { rolldown, defineConfig, RolldownMagicString } = await vi.importActual<typeof Rolldown>( 'rolldown' );

	return {
		async rolldown( rolldownOptions: Rolldown.RolldownOptions ) {
			const build = await rolldown( rolldownOptions );

			return {
				write: ( options: Rolldown.OutputOptions ) => build.generate( options )
			};
		},

		defineConfig,
		RolldownMagicString
	};
} );

/**
 * Mocks Rolldown.
 */
function setRolldownMock( mock: any ) {
	vi.spyOn( Rolldown, 'rolldown' ).mockImplementationOnce( mock );
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

beforeEach( () => {
	setProcessCwdMock();
} );

function expectFileNames( output: Rolldown.RolldownOutput[ 'output' ], fileNames: Array<string> ): void {
	const actualFileNames = output.map( o => o.fileName );

	expect( actualFileNames ).toHaveLength( fileNames.length );
	expect( actualFileNames ).toEqual( expect.arrayContaining( fileNames ) );
}

function getAsset( output: Rolldown.RolldownOutput[ 'output' ], fileName: string ): Rolldown.OutputAsset {
	return output.find( item => item.type === 'asset' && item.fileName === fileName ) as Rolldown.OutputAsset;
}

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

	expectFileNames( output, [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css'
	] );
	expect( getAsset( output, 'index.css' ).source.toString() ).toContain( 'border: 1px solid red' );
	expect( getAsset( output, 'index.css' ).source.toString() ).toContain( '.ck-content' );
	expect( getAsset( output, 'index.css' ).source.toString() ).not.toContain( '@import' );
	expect( getAsset( output, 'index-editor.css' ).source.toString() ).toContain( 'border: 1px solid red' );
	expect( getAsset( output, 'index-content.css' ).source.toString() ).toContain( '.ck-content' );
} );

test( 'TypeScript declarations', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		declarations: true
	} );

	expect( output[ 0 ].code ).not.contain( 'TestType' );

	expectFileNames( output, [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css',
		'input.d.ts',
		'js-extension-import.d.ts',
		'js-extension-source.d.ts'
	] );
} );

test( 'TypeScript source is preferred when a `.js` import has matching `.ts` and `.js` files', async () => {
	const { output } = await build( {
		input: 'src/js-extension-import.ts'
	} );

	expect( output[ 0 ].code ).toContain( 'typescript-source' );
	expect( output[ 0 ].code ).not.toContain( 'javascript-source' );
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

	expectFileNames( output, [
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

	expectFileNames( output, [
		'index.js',
		'index.css',
		'index-editor.css',
		'index-content.css'
	] );

	for ( const fileName of [ 'index.css', 'index-editor.css', 'index-content.css' ] ) {
		expect( getAsset( output, fileName ).source.toString() ).not.toContain( '@import' );
	}

	expect( getAsset( output, 'index.css' ).source.toString() ).toContain( 'border: 1px solid red' );
	expect( getAsset( output, 'index.css' ).source.toString() ).toContain( '.ck-content' );
} );

test( 'Browser parameter set to `true` and name parameter set', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		tsconfig: 'tsconfig.json',
		browser: true,
		name: 'EXAMPLE_OUTPUT_NAME'
	} );

	expectFileNames( output, [
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

	expectFileNames( output, [
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
		 * Because we mocked rolldown to use `rolldown.generate` instead of `rolldown.write`, the output of the
		 * first ESM build is not saved to the disk, so the UMD build cannot be based on it. That's why the
		 * `output` filename matches the `input` filename. However, because the default output name is `index`,
		 * this is still a valid test.
		 */
		output: 'src/input.js',
		tsconfig: 'tsconfig.json',
		browser: true,
		name: 'custom',
		external: [ 'es-toolkit' ],
		globals: { 'es-toolkit': '_' }
	} );

	expectFileNames( output, [
		'input.js',
		'input.css',
		'input-editor.css',
		'input-content.css',
		'input.umd.js'
	] );
} );

test.each( [ 'ckeditor5', 'ckeditor5-premium-features' ] )( 'Uses the JavaScript basename for %s CSS outputs', async outputName => {
	const { output } = await build( {
		input: 'src/input.ts',
		output: `dist/${ outputName }.js`,
		tsconfig: 'tsconfig.json'
	} );

	expectFileNames( output, [
		`${ outputName }.js`,
		`${ outputName }.css`,
		`${ outputName }-editor.css`,
		`${ outputName }-content.css`
	] );
	expect( getAsset( output, `${ outputName }.css` ).source.toString() ).not.toContain( '@import' );
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

	expect( output[ 0 ].code ).not.toContain( 'from \'es-toolkit\'' );
} );

test( 'Externals', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: [ 'es-toolkit' ]
	} );

	expect( output[ 0 ].code ).toContain( 'from "es-toolkit"' );
} );

/**
 * Translations
 */
test( 'Translations', async () => {
	const { output } = await build( {
		input: 'src/input.ts',
		translations: '**/*.po'
	} );

	expect( ( output[ 1 ] as Rolldown.OutputChunk ).code ).toContain( 'Hello world' );

	expectFileNames( output, [
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

	expectFileNames( output, [
		'index.js',
		'index.js.map',
		'index.css.map',
		'index-editor.css.map',
		'index-content.css.map',
		'index.css',
		'index-editor.css',
		'index-content.css'
	] );
} );

test( 'Source map for chunk re-exporting external modules', async () => {
	const { output } = await build( {
		input: 'src/external-reexport.js',
		external: [ 'external-dependency' ],
		sourceMap: true
	} );
	const chunk = output.find( item => item.type === 'chunk' && item.fileName === 'index.js' );

	expectFileNames( output, [
		'index.js',
		'index.js.map',
		'index.css.map',
		'index-editor.css.map',
		'index-content.css.map',
		'index.css',
		'index-editor.css',
		'index-content.css'
	] );
	expect( chunk?.type === 'chunk' ? chunk.code : '' ).toContain( 'sourceMappingURL=index.js.map' );
} );

/**
 * Bundle
 */
test( 'Bundle', async () => {
	const { output } = await build( {
		input: 'src/input.js',
		external: []
	} );

	expect( output[ 0 ].code ).not.toContain( 'from \'es-toolkit\'' );
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

test( 'Pure annotations preserve the marker used by post-processing tools', async () => {
	const { output } = await build( {
		input: 'src/pure-annotation.js',
		sourceMap: true
	} );
	const chunk = output.find( item => item.type === 'chunk' && item.fileName === 'index.js' ) as Rolldown.OutputChunk;
	const sourceMap = output.find( item => item.type === 'asset' && item.fileName === 'index.js.map' ) as Rolldown.OutputAsset;
	const sourceMapContent = JSON.parse( sourceMap.source.toString() );
	const originalSourceIndex = sourceMapContent.sources.findIndex( ( source: string ) => source.endsWith( 'pure-annotation.js' ) );
	const source = sourceMapContent.sourcesContent[ originalSourceIndex ];
	const originalLine = source.split( '\n' ).findIndex( ( line: string ) => line.includes( 'factory()' ) ) + 1;
	const originalColumn = source.split( '\n' )[ originalLine - 1 ].indexOf( 'factory()' );
	const generatedLine = chunk.code.split( '\n' ).findIndex( line => line.includes( 'factory()' ) ) + 1;
	const generatedColumn = chunk.code.split( '\n' )[ generatedLine - 1 ]!.indexOf( 'factory()' );
	const consumer = await new SourceMapConsumer( sourceMapContent );
	const originalPosition = consumer.originalPositionFor( {
		line: generatedLine,
		column: generatedColumn
	} );

	expect( chunk.code ).toContain( '/* #__PURE__ -- @preserve */ factory()' );
	expect( originalPosition.source ).toBe( sourceMapContent.sources[ originalSourceIndex ] );
	expect( originalPosition.line ).toBe( originalLine );
	expect( originalPosition.column ).toBe( originalColumn );
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
	setRolldownMock( () => ( {
		write() {
			throw new Error( 'REASON' );
		}
	} ) );

	const fn = () => build( { input: 'src/input.js' } );

	await expect( fn ).rejects.toThrow( /The build process failed with the following error(.*)REASON/s );
} );

test( 'Throws error with file context using nicely formatter message when build fails', async () => {
	setRolldownMock( () => ( {
		write() {
			const err = new Error() as any;

			err.id = 'FILENAME';
			err.message = 'REASON';

			throw err;
		}
	} ) );

	const fn = () => build( { input: 'src/input.js' } );

	await expect( fn ).rejects.toThrow( /Error occurred when processing the file(.*)FILENAME(.*)REASON/s );
} );

test( 'Error with file context includes frame if provided', async () => {
	setRolldownMock( () => ( {
		write() {
			const err = new Error() as any;

			err.id = 'FILENAME';
			err.message = 'REASON';
			err.frame = 'FRAME';

			throw err;
		}
	} ) );

	const fn = () => build( { input: 'src/input.js' } );

	await expect( fn ).rejects.toThrow( /Error occurred when processing the file(.*)FRAME/s );
} );

test( 'Rewrites package imports to aggregate packages in browser builds', async () => {
	await mockCoreDependencies();
	await mockCommercialDependencies();

	const { output } = await build( {
		input: 'data-for-aggregate-rewrites-tests/import-from-packages.js',
		external: [
			'ckeditor5',
			'ckeditor5-premium-features'
		],
		browser: true,
		name: 'ckeditor5-premium-features'
	} );

	expect( output[ 0 ].code ).toContain( 'import { Command } from "ckeditor5"' );
	expect( output[ 0 ].code ).toContain( 'import { AIAssistant } from "ckeditor5-premium-features"' );
} );

test( 'should not throw when processing a file including a dynamic import expression', async () => {
	await expect( build( {
		input: 'src/dynamic-import.js',
		browser: true,
		name: 're-export-banner'
	} ) ).resolves.toBeTruthy();
} );
