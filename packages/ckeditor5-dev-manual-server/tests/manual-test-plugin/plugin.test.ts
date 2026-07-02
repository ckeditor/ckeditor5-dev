/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { type HtmlTagDescriptor, type ViteDevServer } from 'vite';
import { manualTestsPlugin, type ManualTestsPluginOptions } from '../../src/manual-test-plugin/plugin.js';
import { stripLeadingSlash, toPublicFilePath } from '../../src/utils.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import { createTestServer, getCode } from '../_utils/vite.js';

type ServerHook = ( server: TestServer ) => void;
type ConfigHook = () => {
	build: {
		rolldownOptions: {
			input: Array<string>;
		};
	};
};
type ConfigResolvedHook = ( config: {
	root: string;
	base?: string;
	build: {
		rolldownOptions: {
			input: Array<string>;
		};
	};
} ) => void;
type TransformResult = string | undefined | { html: string; tags: Array<HtmlTagDescriptor> };
type TransformIndexHtmlHook = {
	handler( html: string, context: { filename: string } ): TransformResult;
};
type LoadHook = ( id: string ) => string | null;
type ResolveIdHook = ( id: string ) => string | null;
type TestServer = {
	middlewares: {
		use: ReturnType<typeof vi.fn>;
	};
};

const HEADER_PAGE = '<!DOCTYPE html><html><head><title>Foo</title></head>' +
	'<body><ck-manual-header><p>Steps</p></ck-manual-header></body></html>';

describe( 'manualTestsPlugin()', () => {
	let server: ViteDevServer | undefined;
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-manual-test-plugin-' );
		vi.spyOn( process, 'cwd' ).mockReturnValue( workspaceRoot );
	} );

	afterEach( async () => {
		await server?.close();
		server = undefined;

		await removeDirectory( workspaceRoot );
	} );

	test( 'uses provided package root globs for page entries', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' )
		] );

		server = await createManualTestServer( {
			paths: [ 'packages/ckeditor5-foo' ]
		} );
		const input = server.config.build.rolldownOptions.input as Array<string>;

		expect( input ).to.include( join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ) );
		expect( input ).not.to.include( join( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' ) );
	} );

	test( 'exposes entries collected from provided package root globs', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' )
		] );

		server = await createManualTestServer( {
			paths: [ 'packages/ckeditor5-foo' ]
		} );
		const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
		const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.manual.html' );
		expect( source ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.manual.html' );
	} );

	test( 'ignores plain .html fixtures next to manual tests', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/fixture.html' )
		] );

		server = await createManualTestServer( {
			paths: [ 'packages/*' ]
		} );
		const input = server.config.build.rolldownOptions.input as Array<string>;

		expect( input ).to.include( join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ) );
		expect( input ).not.to.include( join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/fixture.html' ) );
	} );

	test( 'filters build inputs and catalog entries using included full package names', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' )
		] );

		server = await createManualTestServer( {
			paths: [ 'packages/*' ],
			include: [ 'ckeditor5-bar' ]
		} );
		const input = server.config.build.rolldownOptions.input as Array<string>;
		const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
		const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( input ).to.include( join( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' ) );
		expect( input ).not.to.include( join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ) );
		expect( source ).to.contain( '/packages/ckeditor5-bar/tests/manual/bar.manual.html' );
		expect( source ).not.to.contain( '/packages/ckeditor5-foo/tests/manual/foo.manual.html' );
	} );

	test( 'filters manual tests using included short package names', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' )
		] );

		server = await createManualTestServer( {
			paths: [ 'packages/*' ],
			include: [ 'foo' ]
		} );
		const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
		const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.manual.html' );
		expect( source ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.manual.html' );
	} );

	test( 'exposes entry links relative to the catalog when using relative Vite base', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' );

		const source = loadEntries( { paths: [ 'packages/*' ] }, './' );

		expect( source ).to.contain( './packages/ckeditor5-foo/tests/manual/foo.manual.html' );
	} );

	test( 'exposes entry links prefixed with the configured Vite base', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' );

		const source = loadEntries( { paths: [ 'packages/*' ] }, '/manual/' );

		expect( source ).to.contain( '/manual/packages/ckeditor5-foo/tests/manual/foo.manual.html' );
	} );

	test( 'injects the bootstrap, header script and data when the page opts in via <ck-manual-header>', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html', HEADER_PAGE );

		const plugin = manualTestsPlugin( { paths: [ 'packages/*' ] } );
		const config = ( plugin.config as ConfigHook )();
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;

		( plugin.configResolved as ConfigResolvedHook )( { root: workspaceRoot, base: './', build: config.build } );

		const result = transformIndexHtml.handler( HEADER_PAGE, {
			filename: join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' )
		} ) as { html: string; tags: Array<HtmlTagDescriptor> };

		const meta = result.tags.find( tag => tag.tag == 'meta' )!;
		const scripts = result.tags.filter( tag => tag.tag == 'script' );

		expect( result.html ).to.equal( HEADER_PAGE );
		expect( meta.attrs ).to.deep.include( { 'name': 'ck-manual-header', 'data-package-name': 'ckeditor5-foo' } );
		expect( meta.attrs![ 'data-catalog-href' ] ).to.equal( '../../../../index.html' );
		expect( meta.injectTo ).to.equal( 'head' );
		expect( scripts.map( script => String( script.attrs!.src ) ).join() ).to.contain( 'manual-bootstrap.ts' );
		expect( scripts.map( script => String( script.attrs!.src ) ).join() ).to.contain( 'manual-header.ts' );

		for ( const script of scripts ) {
			expect( script.attrs!.type ).to.equal( 'module' );
			expect( script.injectTo ).to.equal( 'head' );
		}
	} );

	test( 'uses the configured base as the catalog href for a non-relative base', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html', HEADER_PAGE );

		const plugin = manualTestsPlugin( { paths: [ 'packages/*' ] } );
		const config = ( plugin.config as ConfigHook )();
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;

		( plugin.configResolved as ConfigResolvedHook )( { root: workspaceRoot, base: '/manual/', build: config.build } );

		const result = transformIndexHtml.handler( HEADER_PAGE, {
			filename: join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' )
		} ) as { html: string; tags: Array<HtmlTagDescriptor> };
		const meta = result.tags.find( tag => tag.tag == 'meta' )!;

		expect( meta.attrs![ 'data-catalog-href' ] ).to.equal( '/manual/' );
	} );

	test( 'injects only the bootstrap script for manual pages without <ck-manual-header>', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html', '<p>No chrome</p>' );

		const plugin = manualTestsPlugin( { paths: [ 'packages/*' ] } );
		const config = ( plugin.config as ConfigHook )();
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;

		( plugin.configResolved as ConfigResolvedHook )( { root: workspaceRoot, base: './', build: config.build } );

		const result = transformIndexHtml.handler( '<p>No chrome</p>', {
			filename: join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' )
		} ) as { html: string; tags: Array<HtmlTagDescriptor> };

		expect( result.html ).to.equal( '<p>No chrome</p>' );
		expect( result.tags ).to.have.lengthOf( 1 );
		expect( result.tags[ 0 ]!.tag ).to.equal( 'script' );
		expect( String( result.tags[ 0 ]!.attrs!.src ) ).to.contain( 'manual-bootstrap.ts' );
		expect( result.tags[ 0 ]!.attrs!.type ).to.equal( 'module' );
	} );

	test( 'uses the Vite root instead of the current working directory for page entries', async () => {
		const currentWorkingDirectory = await createTemporaryDirectory( 'ckeditor5-manual-test-plugin-cwd-' );

		try {
			vi.spyOn( process, 'cwd' ).mockReturnValue( currentWorkingDirectory );

			await Promise.all( [
				createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' ),
				createFile( currentWorkingDirectory, 'packages/ckeditor5-bar/tests/manual/bar.manual.html' )
			] );

			server = await createManualTestServer( { paths: [ 'packages/*' ] } );
			const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
			const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

			expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.manual.html' );
			expect( source ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.manual.html' );
		} finally {
			await removeDirectory( currentWorkingDirectory );
		}
	} );

	test( 'uses current working directory for initial build inputs', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' );

		const plugin = manualTestsPlugin( { paths: [ 'packages/*' ] } );
		const config = ( plugin.config as ConfigHook )();

		expect( config.build.rolldownOptions.input ).to.include(
			join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.manual.html' )
		);
	} );

	test( 'does not resolve unknown virtual module requests', async () => {
		server = await createManualTestServer( { paths: [] } );

		expect( await server.pluginContainer.resolveId( 'virtual:other' ) ).to.be.null;
	} );

	test( 'does not load unknown virtual module requests', () => {
		const plugin = manualTestsPlugin( { paths: [] } );

		expect( ( plugin.load as LoadHook )( '\0virtual:other' ) ).to.be.null;
	} );

	test( 'registers the manual catalog middleware for dev server', () => {
		const plugin = manualTestsPlugin( { paths: [] } );
		const devServer = createMiddlewareServer();

		( plugin.configureServer as unknown as ServerHook )( devServer );

		expect( devServer.middlewares.use ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'registers the catalog HTML as the build index page', () => {
		const plugin = manualTestsPlugin( { paths: [] } );
		const config = ( plugin.config as ConfigHook )();
		const catalogBuildInputFilePath = join( workspaceRoot, 'index.html' );

		expect( config.build.rolldownOptions.input ).to.include( catalogBuildInputFilePath );

		( plugin.configResolved as ConfigResolvedHook )( {
			root: workspaceRoot,
			build: config.build
		} );

		expect( ( plugin.resolveId as ResolveIdHook )( 'index.html' ) ).to.equal( catalogBuildInputFilePath );
		expect( ( plugin.load as LoadHook )( catalogBuildInputFilePath ) )
			.to.contain( '<script type="module" src="./catalog.ts"></script>' );
	} );

	test( 'rewrites root and index requests to the manual test catalog', () => {
		const plugin = manualTestsPlugin( { paths: [] } );
		const server = createMiddlewareServer();

		( plugin.configureServer as unknown as ServerHook )( server );

		const middleware = server.middlewares.use.mock.calls[ 0 ]![ 0 ] as (
			request: { url?: string },
			response: unknown,
			next: () => void
		) => void;
		const rootRequest = { url: '/?q=1' };
		const indexRequest = { url: '/index.html?filter=all' };
		const otherRequest = { url: '/manual.html' };
		const missingUrlRequest = {};
		const invalidUrlRequest = { url: 'http://%' };
		const next = vi.fn();

		middleware( rootRequest, {}, next );
		middleware( indexRequest, {}, next );
		middleware( otherRequest, {}, next );
		middleware( missingUrlRequest, {}, next );
		middleware( invalidUrlRequest, {}, next );

		expect( rootRequest.url ).to.equal( '/index.html?q=1' );
		expect( indexRequest.url ).to.equal( '/index.html?filter=all' );
		expect( otherRequest.url ).to.equal( '/manual.html' );
		expect( missingUrlRequest ).to.have.property( 'url' ).that.equals( '/index.html' );
		expect( invalidUrlRequest.url ).to.equal( 'http://%' );
		expect( next ).toHaveBeenCalledTimes( 5 );
	} );

	test( 'rewrites the catalog script to a public file path', async () => {
		const catalogFilePath = resolve( import.meta.dirname, '../../theme/catalog.html' );
		const catalogScriptFilePath = resolve( import.meta.dirname, '../../theme/catalog.ts' ).replace( /\\/g, '/' );
		server = await createManualTestServer( { paths: [] } );

		const html = await server.transformIndexHtml(
			toPublicFilePath( catalogFilePath, workspaceRoot ),
			'<script type="module" src="./catalog.ts"></script>'
		);

		expect( html ).to.contain( '<script type="module" src="/@vite/client"></script>' );
		expect( html ).to.contain( `<script type="module" src="/@fs/${ stripLeadingSlash( catalogScriptFilePath ) }"></script>` );
	} );

	test( 'rewrites the catalog script when the context filename uses Windows separators', () => {
		const plugin = manualTestsPlugin( { paths: [] } );
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;
		const catalogFilePath = resolve( import.meta.dirname, '../../theme/catalog.html' );
		const catalogScriptFilePath = resolve( import.meta.dirname, '../../theme/catalog.ts' ).replace( /\\/g, '/' );

		expect( transformIndexHtml.handler(
			'<script type="module" src="./catalog.ts"></script>',
			{ filename: catalogFilePath.replace( /\//g, '\\' ) }
		) ).to.equal( `<script type="module" src="/@fs/${ catalogScriptFilePath }"></script>` );
	} );

	test( 'rewrites the catalog script for the synthetic build index page', () => {
		const plugin = manualTestsPlugin( { paths: [] } );
		const config = ( plugin.config as ConfigHook )();
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;
		const catalogScriptFilePath = resolve( import.meta.dirname, '../../theme/catalog.ts' ).replace( /\\/g, '/' );

		( plugin.configResolved as ConfigResolvedHook )( {
			root: workspaceRoot,
			build: config.build
		} );

		expect( transformIndexHtml.handler(
			'<script type="module" src="./catalog.ts"></script>',
			{ filename: join( workspaceRoot, 'index.html' ) }
		) ).to.equal( `<script type="module" src="/@fs/${ catalogScriptFilePath }"></script>` );
	} );

	test( 'passes through HTML files that are not manual pages', () => {
		const plugin = manualTestsPlugin( { paths: [] } );
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;

		expect( transformIndexHtml.handler( '<p>Sample</p>', {
			filename: join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/missing.manual.html' )
		} ) ).to.be.undefined;
	} );

	function loadEntries( options: ManualTestsPluginOptions, base: string ): string {
		const plugin = manualTestsPlugin( options );
		const config = ( plugin.config as ConfigHook )();

		( plugin.configResolved as ConfigResolvedHook )( { root: workspaceRoot, base, build: config.build } );

		return ( plugin.load as LoadHook )( '\0virtual:ckeditor5-manual-entries' )!;
	}

	async function createManualTestServer( options: ManualTestsPluginOptions ): Promise<ViteDevServer> {
		return createTestServer( {
			root: workspaceRoot,
			appType: 'mpa',
			plugins: [
				manualTestsPlugin( options )
			]
		} );
	}
} );

function createMiddlewareServer(): TestServer {
	return {
		middlewares: {
			use: vi.fn()
		}
	};
}
