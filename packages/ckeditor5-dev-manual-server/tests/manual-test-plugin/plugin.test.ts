/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { type ViteDevServer } from 'vite';
import { manualTestsPlugin } from '../../src/manual-test-plugin/plugin.js';
import { toPublicFilePath } from '../../src/utils.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import { createTestServer, getCode } from '../_utils/vite.js';

type ServerHook = ( server: TestServer ) => void;
type TransformIndexHtmlHook = {
	handler( html: string, context: { filename: string } ): string | undefined;
};
type TestServer = {
	middlewares: {
		use: ReturnType<typeof vi.fn>;
	};
};

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

	test( 'uses provided broad manual test globs for page entries', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.js' )
		] );

		server = await createManualTestServer( [ 'packages/ckeditor5-foo/tests/manual/**/*' ] );
		const input = server.config.build.rolldownOptions.input as Array<string>;

		expect( input ).to.include( join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ) );
		expect( input ).not.to.include( join( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.html' ) );
	} );

	test( 'exposes entries collected from provided broad manual test globs', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.ts' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.ts' )
		] );

		server = await createManualTestServer( [ 'packages/ckeditor5-foo/tests/manual/**/*' ] );
		const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
		const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.html' );
		expect( source ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.html' );
	} );

	test( 'uses the Vite root instead of the current working directory for page entries', async () => {
		const currentWorkingDirectory = await createTemporaryDirectory( 'ckeditor5-manual-test-plugin-cwd-' );

		try {
			vi.spyOn( process, 'cwd' ).mockReturnValue( currentWorkingDirectory );

			await Promise.all( [
				createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
				createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.ts' ),
				createFile( currentWorkingDirectory, 'packages/ckeditor5-bar/tests/manual/bar.html' ),
				createFile( currentWorkingDirectory, 'packages/ckeditor5-bar/tests/manual/bar.ts' )
			] );

			server = await createManualTestServer( [ 'packages/*/tests/manual/**/*' ] );
			const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
			const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

			expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.html' );
			expect( source ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.html' );
		} finally {
			await removeDirectory( currentWorkingDirectory );
		}
	} );

	test( 'updates entries when new manual page files are added', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.ts' )
		] );

		server = await createManualTestServer( [ 'packages/*/tests/manual/**/*' ] );
		const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
		const initialSource = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( initialSource ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.html' );
		expect( initialSource ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.html' );

		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.ts' )
		] );

		const updatedSource = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( updatedSource ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.html' );
		expect( updatedSource ).to.contain( '/packages/ckeditor5-bar/tests/manual/bar.html' );
	} );

	test( 'does not resolve unknown virtual module requests', async () => {
		server = await createManualTestServer( [] );

		expect( await server.pluginContainer.resolveId( 'virtual:other' ) ).to.be.null;
	} );

	test( 'registers manual test middlewares for dev and preview servers', () => {
		const plugin = manualTestsPlugin( [] );
		const devServer = createMiddlewareServer();
		const previewServer = createMiddlewareServer();

		( plugin.configureServer as unknown as ServerHook )( devServer );
		( plugin.configurePreviewServer as unknown as ServerHook )( previewServer );

		expect( devServer.middlewares.use ).toHaveBeenCalledTimes( 2 );
		expect( previewServer.middlewares.use ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'rewrites root and index requests to the manual test catalog', () => {
		const plugin = manualTestsPlugin( [] );
		const server = createMiddlewareServer();

		( plugin.configureServer as unknown as ServerHook )( server );

		const middleware = server.middlewares.use.mock.calls[ 1 ]![ 0 ] as (
			request: { url?: string },
			response: unknown,
			next: () => void
		) => void;
		const rootRequest = { url: '/?q=1' };
		const indexRequest = { url: '/index.html' };
		const otherRequest = { url: '/manual.html' };
		const next = vi.fn();

		middleware( rootRequest, {}, next );
		middleware( indexRequest, {}, next );
		middleware( otherRequest, {}, next );

		expect( rootRequest.url ).to.contain( '/theme/catalog.html' );
		expect( indexRequest.url ).to.contain( '/theme/catalog.html' );
		expect( otherRequest.url ).to.equal( '/manual.html' );
		expect( next ).toHaveBeenCalledTimes( 3 );
	} );

	test( 'rewrites the catalog script to a public file path', async () => {
		const catalogFilePath = resolve( import.meta.dirname, '../../theme/catalog.html' );
		const catalogScriptFilePath = resolve( import.meta.dirname, '../../theme/catalog.ts' ).replace( /\\/g, '/' );
		server = await createManualTestServer( [] );

		const html = await server.transformIndexHtml(
			toPublicFilePath( catalogFilePath, workspaceRoot ),
			'<script type="module" src="./catalog.ts"></script>'
		);

		expect( html ).to.contain( '<script type="module" src="/@vite/client"></script>' );
		expect( html ).to.contain( `<script type="module" src="/@fs${ catalogScriptFilePath }"></script>` );
	} );

	test( 'rewrites the catalog script when the context filename uses Windows separators', () => {
		const plugin = manualTestsPlugin( [] );
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;
		const catalogFilePath = resolve( import.meta.dirname, '../../theme/catalog.html' );
		const catalogScriptFilePath = resolve( import.meta.dirname, '../../theme/catalog.ts' ).replace( /\\/g, '/' );

		expect( transformIndexHtml.handler(
			'<script type="module" src="./catalog.ts"></script>',
			{ filename: catalogFilePath.replace( /\//g, '\\' ) }
		) ).to.equal( `<script type="module" src="/@fs/${ catalogScriptFilePath }"></script>` );
	} );

	test( 'passes through HTML files that are not manual pages', () => {
		const plugin = manualTestsPlugin( [] );
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;

		expect( transformIndexHtml.handler( '<p>Sample</p>', {
			filename: join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/missing.html' )
		} ) ).to.be.undefined;
	} );

	test( 'wraps manual page HTML with the shell', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html', '<title>Foo</title><p>Manual test</p>' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		server = await createManualTestServer( [ 'packages/ckeditor5-foo/tests/manual/**/*' ] );
		const html = await server.transformIndexHtml(
			'/packages/ckeditor5-foo/tests/manual/foo.html',
			'<title>Foo</title><p>Manual test</p>'
		);

		expect( html ).to.contain( 'manual-test-container' );
		expect( html ).to.contain( '<title>Foo</title>' );
		expect( html ).to.contain( '<p>Manual test</p>' );
	} );

	async function createManualTestServer( manualTestPatterns: Array<string> ): Promise<ViteDevServer> {
		return createTestServer( {
			root: workspaceRoot,
			appType: 'mpa',
			plugins: [
				manualTestsPlugin( manualTestPatterns )
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
