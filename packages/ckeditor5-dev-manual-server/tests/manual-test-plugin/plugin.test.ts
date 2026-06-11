/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { type ViteDevServer } from 'vite';
import { manualTestsPlugin } from '../../src/manual-test-plugin/plugin.js';
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
	build: {
		rolldownOptions: {
			input: Array<string>;
		};
	};
} ) => void;
type TransformIndexHtmlHook = {
	handler( html: string, context: { filename: string } ): string | undefined;
};
type GenerateBundleHook = ( this: { emitFile: ReturnType<typeof vi.fn> } ) => void;
type LoadHook = ( id: string ) => string | null;
type MemoryFile = { etag?: string; source: string | Uint8Array };
type MemoryFilesGetMock = Mock<( filePath: string ) => MemoryFile | undefined>;
type TestServer = {
	middlewares: {
		use: ReturnType<typeof vi.fn>;
	};
	environments: {
		client: {
			memoryFiles: {
				get: MemoryFilesGetMock;
			};
		};
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

	test( 'exposes entries collected from manual test globs with extension patterns', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.ts' )
		] );

		server = await createManualTestServer( [ 'packages/*/tests/manual/**/*.{html,js,md,ts}' ] );
		const resolvedId = await server.pluginContainer.resolveId( 'virtual:ckeditor5-manual-entries' );
		const source = getCode( await server.pluginContainer.load( resolvedId!.id ) );

		expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.html' );
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

	test( 'updates build inputs after Vite resolves the root', async () => {
		const currentWorkingDirectory = await createTemporaryDirectory( 'ckeditor5-manual-test-plugin-cwd-' );

		try {
			vi.spyOn( process, 'cwd' ).mockReturnValue( currentWorkingDirectory );

			await Promise.all( [
				createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
				createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.ts' ),
				createFile( currentWorkingDirectory, 'project/packages/ckeditor5-bar/tests/manual/bar.html' ),
				createFile( currentWorkingDirectory, 'project/packages/ckeditor5-bar/tests/manual/bar.ts' )
			] );

			const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
			const config = ( plugin.config as ConfigHook )();

			( plugin.configResolved as ConfigResolvedHook )( {
				root: workspaceRoot,
				build: config.build
			} );

			expect( config.build.rolldownOptions.input ).to.include(
				join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' )
			);
			expect( config.build.rolldownOptions.input ).not.to.include(
				join( currentWorkingDirectory, 'project/packages/ckeditor5-bar/tests/manual/bar.html' )
			);
		} finally {
			await removeDirectory( currentWorkingDirectory );
		}
	} );

	test( 'uses current working directory for initial build inputs', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.ts' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const config = ( plugin.config as ConfigHook )();

		expect( config.build.rolldownOptions.input ).to.include(
			join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' )
		);
	} );

	test( 'does not resolve unknown virtual module requests', async () => {
		server = await createManualTestServer( [] );

		expect( await server.pluginContainer.resolveId( 'virtual:other' ) ).to.be.null;
	} );

	test( 'does not load unknown virtual module requests', () => {
		const plugin = manualTestsPlugin( [] );

		expect( ( plugin.load as LoadHook )( '\u0000virtual:other' ) ).to.be.null;
	} );

	test( 'registers manual test middlewares for dev and preview servers', () => {
		const plugin = manualTestsPlugin( [] );
		const devServer = createMiddlewareServer();
		const previewServer = createMiddlewareServer();

		( plugin.configureServer as unknown as ServerHook )( devServer );
		( plugin.configurePreviewServer as unknown as ServerHook )( previewServer );

		expect( devServer.middlewares.use ).toHaveBeenCalledTimes( 2 );
		expect( previewServer.middlewares.use ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'emits manual static assets during build', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/image.png', 'image' );
		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const config = ( plugin.config as ConfigHook )();
		const emitFile = vi.fn();

		( plugin.configResolved as ConfigResolvedHook )( {
			root: workspaceRoot,
			build: config.build
		} );
		( plugin.generateBundle as unknown as GenerateBundleHook ).call( { emitFile } );

		expect( emitFile ).toHaveBeenCalledWith( {
			type: 'asset',
			fileName: 'packages/ckeditor5-foo/tests/manual/assets/image.png',
			source: Buffer.from( 'image' )
		} );
	} );

	test( 'updates bundled manual HTML from current source in dev server', async () => {
		await Promise.all( [
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/tests/manual/foo.html',
				'<head><script src="https://cdn.example.com/foo.js"></script></head><p>Fresh manual test</p>'
			),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const server = createMiddlewareServer();

		server.environments.client.memoryFiles.get.mockReturnValue( {
			etag: 'stale-etag',
			source: '<html><head><script type="module" crossorigin src="/assets/foo.js"></script>' +
				'<link rel="modulepreload" crossorigin href="/assets/chunk.js"></head><body>Old</body></html>'
		} );

		( plugin.configureServer as unknown as ServerHook )( server );

		const file = server.environments.client.memoryFiles.get( 'packages/ckeditor5-foo/tests/manual/foo.html' )!;
		const html = file.source as string;

		expect( file ).not.to.have.property( 'etag' );
		expect( html ).to.contain( '<p>Fresh manual test</p>' );
		expect( html ).to.contain( 'theme/shell.ts' );
		expect( html ).to.contain( 'src="https://cdn.example.com/foo.js"' );
		expect( html ).to.contain( 'src="/assets/foo.js"' );
		expect( html ).to.contain( 'href="/assets/chunk.js"' );
		expect( html ).not.to.contain( 'src="./foo.js"' );
	} );

	test( 'replaces source shell script when bundled manual HTML includes bundled shell assets', async () => {
		await Promise.all( [
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/tests/manual/foo.html',
				'<head><script>window.inline = true;</script></head><p>Fresh manual test</p>'
			),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const server = createMiddlewareServer();

		server.environments.client.memoryFiles.get.mockReturnValue( {
			source: '<html><head>\n<script type="module" crossorigin src="/assets/shell-abc.js"></script>' +
				'<script type="module" crossorigin src="/assets/foo.js"></script></head><body>Old</body></html>'
		} );

		( plugin.configureServer as unknown as ServerHook )( server );

		const file = server.environments.client.memoryFiles.get( 'packages/ckeditor5-foo/tests/manual/foo.html' )!;
		const html = file.source as string;

		expect( html ).to.contain( '<script>window.inline = true;</script>' );
		expect( html ).to.contain( 'src="/assets/shell-abc.js"' );
		expect( html ).to.contain( 'src="/assets/foo.js"' );
		expect( html ).not.to.contain( 'theme/shell.ts' );
		expect( html ).not.to.contain( 'src="./foo.js"' );
	} );

	test( 'replaces source shell script when bundled manual HTML includes bundled shell modulepreload', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html', '<p>Fresh manual test</p>' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const server = createMiddlewareServer();

		server.environments.client.memoryFiles.get.mockReturnValue( {
			source: '<html><head>\n<link rel="modulepreload" crossorigin href="/assets/shell-abc.js">' +
				'<script type="module" crossorigin src="/assets/foo.js"></script></head><body>Old</body></html>'
		} );

		( plugin.configureServer as unknown as ServerHook )( server );

		const file = server.environments.client.memoryFiles.get( 'packages/ckeditor5-foo/tests/manual/foo.html' )!;
		const html = file.source as string;

		expect( html ).to.contain( 'href="/assets/shell-abc.js"' );
		expect( html ).to.contain( 'src="/assets/foo.js"' );
		expect( html ).not.to.contain( 'theme/shell.ts' );
		expect( html ).not.to.contain( 'src="./foo.js"' );
	} );

	test( 'updates bundled manual HTML from current source for leading slash paths in dev server', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html', '<p>Fresh manual test</p>' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const server = createMiddlewareServer();

		server.environments.client.memoryFiles.get.mockReturnValue( {
			source: '<html><head><script type="module" crossorigin src="/assets/foo.js"></script></head><body>Old</body></html>'
		} );

		( plugin.configureServer as unknown as ServerHook )( server );

		const file = server.environments.client.memoryFiles.get( '/packages/ckeditor5-foo/tests/manual/foo.html' )!;
		const html = file.source as string;

		expect( html ).to.contain( '<p>Fresh manual test</p>' );
		expect( html ).to.contain( 'src="/assets/foo.js"' );
		expect( html ).not.to.contain( 'src="./foo.js"' );
	} );

	test( 'keeps bundled files that are not collected manual pages unchanged', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html', '<p>Fresh manual test</p>' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const server = createMiddlewareServer();
		const bundledFile = { source: '<html><head></head><body>Other</body></html>' };

		server.environments.client.memoryFiles.get.mockReturnValue( bundledFile );
		( plugin.configureServer as unknown as ServerHook )( server );

		expect( server.environments.client.memoryFiles.get( 'packages/ckeditor5-foo/tests/manual/missing.html' ) )
			.to.equal( bundledFile );
	} );

	test( 'keeps missing bundled files unchanged', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html', '<p>Fresh manual test</p>' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/*/tests/manual/**/*' ] );
		const server = createMiddlewareServer();

		server.environments.client.memoryFiles.get.mockReturnValue( undefined );
		( plugin.configureServer as unknown as ServerHook )( server );

		expect( server.environments.client.memoryFiles.get( 'packages/ckeditor5-foo/tests/manual/foo.html' ) )
			.to.be.undefined;
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

		expect( rootRequest.url ).to.contain( '/theme/catalog.html' );
		expect( rootRequest.url ).to.contain( '?q=1' );
		expect( indexRequest.url ).to.contain( '/theme/catalog.html' );
		expect( indexRequest.url ).to.contain( '?filter=all' );
		expect( otherRequest.url ).to.equal( '/manual.html' );
		expect( missingUrlRequest ).to.have.property( 'url' ).that.contains( '/theme/catalog.html' );
		expect( invalidUrlRequest.url ).to.equal( 'http://%' );
		expect( next ).toHaveBeenCalledTimes( 5 );
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
		expect( html ).to.contain( `<script type="module" src="/@fs/${ stripLeadingSlash( catalogScriptFilePath ) }"></script>` );
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
		},
		environments: {
			client: {
				memoryFiles: {
					get: vi.fn<( filePath: string ) => MemoryFile | undefined>()
				}
			}
		}
	};
}
