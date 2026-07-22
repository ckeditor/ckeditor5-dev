/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { test, expect, vi } from 'vitest';
import upath from 'upath';
import { rolldown, type RolldownOutput, type OutputAsset, type OutputOptions, type Plugin } from 'rolldown';
import { bundleCss, rawImport, type RollupBundleCssOptions } from '../../../src/index.js';

async function generateBundle(
	options: RollupBundleCssOptions,
	input: string = './fixtures/input.ts',
	plugins: Array<Plugin> = [],
	outputOptions: OutputOptions = {}
): Promise<RolldownOutput[ 'output' ]> {
	const bundle = await rolldown( {
		input: join( import.meta.dirname, input ),
		resolve: {
			modules: [ join( import.meta.dirname, './fixtures/packages' ), 'node_modules' ]
		},
		plugins: [ ...plugins, bundleCss( options ) ]
	} );
	const generateOptions: OutputOptions = {
		format: 'esm',
		assetFileNames: '[name][extname]',
		...outputOptions
	};

	if ( !generateOptions.file && !generateOptions.dir ) {
		generateOptions.file = 'input.js';
	}

	return ( await bundle.generate( generateOptions ) ).output;
}

function getAsset( output: RolldownOutput[ 'output' ], fileName: string ): OutputAsset {
	const asset = output.find( output => output.fileName === fileName );

	expect( asset ).toBeDefined();
	expect( asset!.type ).toBe( 'asset' );

	return asset as OutputAsset;
}

test( 'bundles explicit editor and content roots into three self-contained assets in source order', async () => {
	const output = await generateBundle( { fileName: 'styles.css' } );
	const combined = getAsset( output, 'styles.css' ).source.toString();
	const editor = getAsset( output, 'styles-editor.css' ).source.toString();
	const content = getAsset( output, 'styles-content.css' ).source.toString();

	expect( combined ).toContain( '.order-one' );
	expect( combined ).toContain( '.order-two' );
	expect( combined.indexOf( '.order-one' ) ).toBeLessThan( combined.indexOf( '.order-two' ) );
	expect( editor ).toContain( '.order-one' );
	expect( editor ).not.toContain( '.order-two' );
	expect( content ).toContain( '.order-two' );
	expect( content ).not.toContain( '.order-one' );
	expect( output.filter( output => output.fileName.endsWith( '.css' ) ) ).toHaveLength( 3 );
	expect( [ combined, editor, content ].every( css => !css.includes( '@import' ) ) ).toBe( true );
} );

test( 'bundles monorepo source dependency roots into self-contained assets', async () => {
	const output = await generateBundle( {
		fileName: 'aggregate.css'
	}, './fixtures/monorepo/packages/aggregate-package/src/index.ts' );
	const combined = getAsset( output, 'aggregate.css' ).source.toString();
	const editor = getAsset( output, 'aggregate-editor.css' ).source.toString();
	const content = getAsset( output, 'aggregate-content.css' ).source.toString();

	expect( editor ).not.toContain( '@import' );
	expect( content ).not.toContain( '@import' );
	expect( editor ).toContain( '.aggregate-editor-leaf' );
	expect( editor ).toContain( '.dependency-editor-leaf' );
	expect( content ).toContain( '.aggregate-content-leaf' );
	expect( content ).toContain( '.dependency-content-leaf' );

	const combinedOrder = [
		'.aggregate-editor-leaf',
		'.aggregate-content-leaf',
		'.dependency-editor-leaf',
		'.dependency-content-leaf'
	].map( selector => combined.indexOf( selector ) );

	expect( combinedOrder ).toEqual( [ ...combinedOrder ].sort( ( a, b ) => a - b ) );
	expect( combinedOrder.every( index => index >= 0 ) ).toBe( true );

	// CSS entry points imported multiple times must be bundled only once.
	expect( editor.match( /\.dependency-editor-leaf/g ) ).toHaveLength( 1 );
} );

test( 'keeps the last occurrence of CSS entry points imported multiple times', async () => {
	const output = await generateBundle( {
		fileName: 'aggregate.css'
	}, './fixtures/monorepo/input-dependency-first.ts' );
	const combined = getAsset( output, 'aggregate.css' ).source.toString();

	expect( combined ).toContain( '.aggregate-editor-leaf' );
	expect( combined ).toContain( '.dependency-editor-leaf' );
	expect( combined ).toContain( '.aggregate-content-leaf' );
	expect( combined ).toContain( '.dependency-content-leaf' );

	// `dependency-package` is imported before `aggregate-package`, but `aggregate-package` re-imports it,
	// so the keep-last deduplication must move the dependency styles after the aggregate styles.
	expect( combined.indexOf( '.aggregate-editor-leaf' ) ).toBeLessThan( combined.indexOf( '.dependency-editor-leaf' ) );
	expect( combined.indexOf( '.aggregate-content-leaf' ) ).toBeLessThan( combined.indexOf( '.dependency-content-leaf' ) );
} );

test( 'always emits all three assets when no CSS roots are imported', async () => {
	const output = await generateBundle( { fileName: 'styles.css' }, './fixtures/input-empty.ts' );

	expect( getAsset( output, 'styles.css' ).source.toString() ).toBe( '\n' );
	expect( getAsset( output, 'styles-editor.css' ).source.toString() ).toBe( '\n' );
	expect( getAsset( output, 'styles-content.css' ).source.toString() ).toBe( '\n' );
} );

test( 'throws when CSS is imported directly instead of through a theme entry point', async () => {
	await expect( generateBundle( { fileName: 'styles.css' }, './fixtures/input-direct-css.ts' ) )
		.rejects.toThrow( 'CSS must be imported through an "index-editor.css" or "index-content.css" entry point' );
} );

test( 'lists every CSS file imported outside a theme entry point in the error message', async () => {
	const promise = generateBundle( { fileName: 'styles.css' }, './fixtures/input-direct-css-multiple.ts' );

	await expect( promise ).rejects.toThrow( 'CSS must be imported through an "index-editor.css" or "index-content.css" entry point' );
	await expect( promise ).rejects.toThrow( / - .*\/direct\.css\n - .*\/direct-second\.css/ );
} );

test( 'allows minifying all generated bundles', async () => {
	const unminified = await generateBundle( { fileName: 'styles.css' } );
	const minified = await generateBundle( { fileName: 'styles.css', minify: true } );

	for ( const fileName of [ 'styles.css', 'styles-editor.css', 'styles-content.css' ] ) {
		expect( getAsset( minified, fileName ).source.toString().length )
			.toBeLessThan( getAsset( unminified, fileName ).source.toString().length );
	}
} );

test( 'emits source maps for all three assets, including empty outputs', async () => {
	const output = await generateBundle( { fileName: 'styles.css', sourceMap: true } );

	for ( const fileName of [ 'styles.css', 'styles-editor.css', 'styles-content.css' ] ) {
		const stylesheet = getAsset( output, fileName ).source.toString();
		const sourceMap = JSON.parse( getAsset( output, `${ fileName }.map` ).source.toString() );

		expect( stylesheet ).toContain( `sourceMappingURL=${ fileName }.map` );
		expect( sourceMap.file ).toBe( fileName );
	}

	const emptyOutput = await generateBundle( {
		fileName: 'empty.css',
		sourceMap: true
	}, './fixtures/input-empty.ts' );

	expect( getAsset( emptyOutput, 'empty-editor.css.map' ) ).toBeDefined();
	expect( getAsset( emptyOutput, 'empty-content.css.map' ) ).toBeDefined();
} );

test( 'works with output.dir and preserved modules', async () => {
	const output = await generateBundle( { fileName: 'styles.css' }, './fixtures/input.ts', [], {
		dir: 'dist',
		preserveModules: true
	} );

	expect( getAsset( output, 'styles-editor.css' ).source.toString() ).toContain( '.order-one' );
} );

test( 'ignores raw CSS imports handled by the rawImport plugin', async () => {
	const output = await generateBundle( { fileName: 'styles.css' }, './fixtures/input-raw-import.ts', [ rawImport() ] );
	const stylesheet = getAsset( output, 'styles.css' ).source.toString();
	const chunk = output.find( item => item.type === 'chunk' )!;

	// The raw import must be embedded in the JavaScript output, not in the CSS bundles.
	expect( chunk.code ).toContain( '.direct-import' );
	expect( stylesheet ).toContain( '.order-one' );
	expect( stylesheet ).not.toContain( '.direct-import' );
} );

test( 'leaves raw CSS imports to other plugins regardless of the plugin order', async () => {
	const bundle = await rolldown( {
		input: join( import.meta.dirname, './fixtures/input-raw-import.ts' ),
		// Unlike in the default configuration, `bundleCss()` is registered before `rawImport()`.
		plugins: [ bundleCss( { fileName: 'styles.css' } ), rawImport() ]
	} );
	const { output } = await bundle.generate( {
		format: 'esm',
		assetFileNames: '[name][extname]',
		file: 'input.js'
	} );
	const chunk = output.find( item => item.type === 'chunk' )!;

	expect( chunk.code ).toContain( '.direct-import' );
	expect( getAsset( output, 'styles.css' ).source.toString() ).not.toContain( '.direct-import' );
} );

test( 'derives editor and content bundle names from a fileName without the ".css" extension', async () => {
	const output = await generateBundle( { fileName: 'styles' } );

	expect( getAsset( output, 'styles' ).source.toString() ).toContain( '.order-one' );
	expect( getAsset( output, 'styles-editor.css' ).source.toString() ).toContain( '.order-one' );
	expect( getAsset( output, 'styles-content.css' ).source.toString() ).toContain( '.order-two' );
} );

test( 'resolves package CSS imports via Rolldown resolution and ignores imports in comments and strings', async () => {
	const output = await generateBundle( { fileName: 'styles.css' }, './fixtures/input-package-import.ts' );
	const stylesheet = getAsset( output, 'styles-editor.css' ).source.toString();

	expect( stylesheet ).toContain( '.from-package' );
	expect( stylesheet ).toContain( '.package-import-local' );

	// Imports inside comments and strings reference nonexistent packages,
	// so resolving them would fail the build. Strings must remain intact.
	expect( stylesheet ).toContain( 'string-package/style.css' );
	expect( /^@import/m.test( stylesheet ) ).toBe( false );
} );

test( 'emits Lightning CSS warnings through Rolldown warnings', async () => {
	const warnings: Array<string> = [];
	const bundle = await rolldown( {
		input: join( import.meta.dirname, './fixtures/input-warning.ts' ),
		onwarn: warning => warnings.push( warning.message ),
		plugins: [ bundleCss( { fileName: 'styles.css' } ) ]
	} );

	await bundle.generate( { format: 'esm', assetFileNames: '[name][extname]', file: 'input.js' } );

	// The same warning appears in the combined, editor, and content bundling passes,
	// but it must be forwarded to Rolldown exactly once.
	const lightningCssWarnings = warnings.filter( warning => warning.includes( 'Lightning CSS warning in' ) );

	expect( lightningCssWarnings ).toHaveLength( 1 );
	expect( lightningCssWarnings[ 0 ] ).toContain( 'Unknown at rule: @unknown' );
	expect( lightningCssWarnings[ 0 ] ).toContain( 'warning.css' );
} );

test( 'throws when encountering external CSS imports', async () => {
	await expect( generateBundle( { fileName: 'styles.css' }, './fixtures/input-external-import.ts' ) )
		.rejects.toThrow( 'External CSS imports are not supported' );
} );

test( 'throws when encountering protocol-relative external CSS imports', async () => {
	await expect( generateBundle( { fileName: 'styles.css' }, './fixtures/input-external-import-protocol-relative.ts' ) )
		.rejects.toThrow( 'External CSS imports are not supported' );
} );

test( 'registers the CSS entry points and their nested imports as watch files', async () => {
	const entryPath = upath.join( import.meta.dirname, 'fixtures/index-editor.css' );
	const nestedPath = upath.join( import.meta.dirname, 'fixtures/first.css' );
	const plugin = bundleCss( { fileName: 'styles.css' } );
	const generateBundleHook = typeof plugin.generateBundle === 'function' ? plugin.generateBundle : plugin.generateBundle!.handler;
	const addWatchFile = vi.fn();
	const context = {
		addWatchFile,
		emitFile: vi.fn(),
		error: ( message: string ) => {
			throw new Error( message );
		},
		getModuleInfo: () => null,
		resolve: async ( specifier: string, importer: string ) => ( {
			id: upath.join( upath.dirname( importer ), specifier ),
			external: false
		} ),
		warn: vi.fn()
	};
	const bundle = {
		'main.js': {
			type: 'chunk',
			isEntry: true,
			isDynamicEntry: false,
			facadeModuleId: null,
			modules: { [ entryPath ]: {} }
		}
	};

	await generateBundleHook.call( context as any, { file: 'dist/main.js' } as any, bundle as any, false );

	const watchedFiles = addWatchFile.mock.calls.flat();

	expect( watchedFiles ).toContain( entryPath );
	expect( watchedFiles ).toContain( nestedPath );
} );
