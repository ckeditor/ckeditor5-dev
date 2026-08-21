/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginContextResolveOptions, ResolveIdExtraOptions } from 'rolldown';
import { build, type HtmlTagDescriptor, type Plugin } from 'vite';
import { manualTestsPlugin } from '../../src/manual-test-plugin/plugin.js';
import { preserveCssImportOrderPlugin } from '../../src/preserve-css-import-order-plugin/plugin.js';
import { stripLeadingSlash, toPosixPath } from '../../src/utils.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';

type ConfigHook = ( config: unknown, environment: { command: 'build' | 'serve' } ) => {
	build: {
		rolldownOptions: {
			output: {
				strictExecutionOrder: boolean;
			};
		};
	};
};
type TransformIndexHtmlHook = {
	handler(
		html: string,
		context: { filename: string }
	): string | undefined | { html: string; tags: Array<HtmlTagDescriptor> };
};
type ResolveIdHook = {
	filter: { id: RegExp };
	handler(
		this: ResolveIdContext,
		source: string,
		importer: string | undefined,
		options: ResolveIdExtraOptions
	): Promise<string | null> | null;
};
type ResolveIdContext = {
	resolve(
		source: string,
		importer: string | undefined,
		options: PluginContextResolveOptions
	): Promise<{ id: string; external?: boolean } | null>;
};
type LoadHook = {
	filter: { id: RegExp };
	handler( id: string ): {
		code: string;
		moduleSideEffects: true;
	} | null;
};

const IMPORT_OPTIONS: ResolveIdExtraOptions = {
	custom: {
		fixture: {
			preserve: true
		}
	},
	isEntry: false,
	kind: 'import-statement'
};

describe( 'preserveCssImportOrderPlugin()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-preserve-css-import-order-plugin-' );
		vi.spyOn( process, 'cwd' ).mockReturnValue( workspaceRoot );
	} );

	afterEach( async () => {
		await removeDirectory( workspaceRoot );
	} );

	it( 'enables strict module execution order in development and production', () => {
		for ( const command of [ 'serve', 'build' ] as const ) {
			const plugin = preserveCssImportOrderPlugin();
			const config = ( plugin.config as ConfigHook )( {}, { command } );

			expect( config.build.rolldownOptions.output.strictExecutionOrder ).to.be.true;
		}
	} );

	it( 'filters module hooks to plain CSS imports and its own virtual modules', () => {
		const plugin = preserveCssImportOrderPlugin();
		const resolveId = plugin.resolveId as ResolveIdHook;
		const load = plugin.load as LoadHook;

		expect( resolveId.filter.id.test( './theme.css' ) ).to.be.true;
		expect( resolveId.filter.id.test( './theme.css?inline' ) ).to.be.false;
		expect( resolveId.filter.id.test( './module.js' ) ).to.be.false;
		expect( load.filter.id.test( '\0virtual:ckeditor5-preserve-css-import-order:hash.js' ) ).to.be.true;
		expect( load.filter.id.test( '/theme.css' ) ).to.be.false;
	} );

	it( 'lets Vite handle CSS imports during development', async () => {
		const plugin = createConfiguredPlugin( 'serve' );
		const resolveId = plugin.resolveId as ResolveIdHook;
		const context = { resolve: vi.fn() } as unknown as ResolveIdContext;

		expect( await resolveId.handler.call( context, './theme.css', '/entry.js', IMPORT_OPTIONS ) ).to.be.null;
		expect( context.resolve ).not.toHaveBeenCalled();
	} );

	it( 'ignores unresolved and external CSS files', async () => {
		const plugin = createConfiguredPlugin();
		const resolveId = plugin.resolveId as ResolveIdHook;
		const context: ResolveIdContext = {
			resolve: vi.fn()
				.mockResolvedValueOnce( null )
				.mockResolvedValueOnce( { id: '/external.css', external: true } )
		};

		expect( await resolveId.handler.call( context, './missing.css', '/entry.js', IMPORT_OPTIONS ) ).to.be.null;
		expect( await resolveId.handler.call( context, './external.css', '/entry.js', IMPORT_OPTIONS ) ).to.be.null;
		expect( context.resolve ).toHaveBeenCalledWith( './missing.css', '/entry.js', {
			...IMPORT_OPTIONS,
			skipSelf: true
		} );
		expect( context.resolve ).toHaveBeenCalledWith( './external.css', '/entry.js', {
			...IMPORT_OPTIONS,
			skipSelf: true
		} );
	} );

	it( 'creates deterministic virtual modules that inject CSS as JavaScript side effects', async () => {
		const plugin = createConfiguredPlugin();
		const resolveId = plugin.resolveId as ResolveIdHook;
		const load = plugin.load as LoadHook;
		const context: ResolveIdContext = {
			resolve: vi.fn().mockResolvedValue( { id: '/theme.css' } )
		};

		const firstId = await resolveId.handler.call( context, './theme.css', '/entry.js', IMPORT_OPTIONS );
		const secondId = await resolveId.handler.call( context, './theme.css', '/entry.js', IMPORT_OPTIONS );
		const loadedModule = load.handler( firstId! );

		expect( secondId ).to.equal( firstId );
		expect( firstId ).to.match( /^\0virtual:ckeditor5-preserve-css-import-order:[a-f\d]{64}\.js$/ );
		expect( load.handler( 'unrelated' ) ).to.be.null;
		expect( load.handler( '\0virtual:ckeditor5-preserve-css-import-order:unknown.js' ) ).to.be.null;
		expect( loadedModule!.code ).to.contain( '"/theme.css?inline"' );
		expect( loadedModule!.moduleSideEffects ).to.be.true;
	} );

	it( 'injects production CSS in module execution order', async () => {
		await Promise.all( [
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/foo.manual.html',
				'<!DOCTYPE html><html><head><style>.inline-style { color: black; }</style>' +
					'<script type="module" src="./foo.js"></script></head><body></body></html>'
			),
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/bar.manual.html',
				'<!DOCTYPE html><html><head><script type="module" src="./bar.js"></script></head><body></body></html>'
			),
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/foo.js',
				'import \'./shared.js\';\nimport \'./first.js\';\n'
			),
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/bar.js',
				'import \'./shared.js\';\nimport \'./second.js\';\n'
			),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/shared.js', 'import \'./shared.css\';\n' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/first.js', 'import \'./first.css\';\n' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/second.js', 'import \'./second.css\';\n' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/shared.css', '.order-shared { color: red; }' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/first.css', '.order-first { color: green; }' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/second.css', '.order-second { color: orange; }' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/theme/index-editor.css', '.order-theme { color: blue; }' )
		] );
		const manualPlugin = manualTestsPlugin( { paths: [ 'packages/*' ] } );
		const transformIndexHtml = manualPlugin.transformIndexHtml as TransformIndexHtmlHook;

		// Keep the fixture entry executable in Node by omitting the unrelated browser-only manual bootstrap,
		// while preserving the catalog transformation required by the production build.
		manualPlugin.transformIndexHtml = {
			order: 'pre',
			handler( html, context ) {
				if ( toPosixPath( context.filename ) == toPosixPath( resolve( workspaceRoot, 'index.html' ) ) ) {
					return transformIndexHtml.handler( html, context );
				}
			}
		};

		await build( {
			root: workspaceRoot,
			appType: 'mpa',
			configFile: false,
			logLevel: 'silent',
			plugins: [
				preserveCssImportOrderPlugin(),
				manualPlugin
			],
			build: {
				outDir: 'build',
				modulePreload: false,
				minify: false
			}
		} );

		const htmlFilePath = join( workspaceRoot, 'build/packages/ckeditor5-foo/manual/foo.manual.html' );
		const html = readFileSync( htmlFilePath, 'utf8' );
		const entryPath = /<script type="module" crossorigin src="([^"]+)"><\/script>/.exec( html )![ 1 ]!;
		const injectedStyles: Array<string> = [];

		vi.stubGlobal( 'document', {
			createElement: () => ( {
				textContent: ''
			} ),
			head: {
				appendChild: ( style: { textContent: string } ) => injectedStyles.push( style.textContent )
			}
		} );

		await import( pathToFileURL( resolve( workspaceRoot, 'build', stripLeadingSlash( entryPath ) ) ).href );

		expect( injectedStyles ).to.have.length( 3 );
		expect( injectedStyles[ 0 ] ).to.contain( '.order-shared' );
		expect( injectedStyles[ 1 ] ).to.contain( '.order-first' );
		expect( injectedStyles[ 2 ] ).to.contain( '.order-theme' );
	} );
} );

function createConfiguredPlugin( command: 'build' | 'serve' = 'build' ): Plugin {
	const plugin = preserveCssImportOrderPlugin();

	( plugin.config as ConfigHook )( {}, { command } );

	return plugin;
}
