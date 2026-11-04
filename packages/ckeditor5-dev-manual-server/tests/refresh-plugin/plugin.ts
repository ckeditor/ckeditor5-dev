/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type HotPayload, type Plugin, type ViteDevServer } from 'vite';
import { refreshPlugin, MANUAL_REFRESH_EVENT_NAME } from '../../src/refresh-plugin/plugin.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import { updateFile } from '../_utils/vite.js';

type TransformHook = {
	order: string;
	filter: { id: RegExp };
	handler( code: string, id: string ): { code: string; map: null } | undefined;
};

const MANUAL_HTML_FILE_PATH = '/workspace/packages/ckeditor5-foo/manual/foo.manual.html';
// The HTML module code that Vite creates from a manual test page with an inline `<style>`,
// a `style` attribute with `url()`, and an inline module script. Each becomes an inline module.
const MANUAL_HTML_MODULE_CODE = [
	'',
	`import "${ MANUAL_HTML_FILE_PATH }?html-proxy&inline-css&index=0.css"`,
	`import "${ MANUAL_HTML_FILE_PATH }?html-proxy&inline-css&style-attr&index=1.css"`,
	`import "${ MANUAL_HTML_FILE_PATH }?html-proxy&index=2.js"`
].join( '\n' );

function configureServer( server: unknown ): void {
	( refreshPlugin().configureServer as unknown as ( server: unknown ) => void )( server );
}

describe( 'refreshPlugin()', () => {
	it( 'applies only in the dev server', () => {
		expect( refreshPlugin().apply ).to.equal( 'serve' );
	} );

	it( 'replaces bundled dev translation updates with the manual refresh prompt', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'bundled-dev-update',
			changedIds: [ '/packages/ckeditor5-foo/lang/translations/pl.ts' ],
			url: '/assets/virtual-translations.js',
			seq: 1
		} );

		expect( clientPayloads ).to.deep.equal( [
			{
				type: 'bundled-dev-update',
				changedIds: [],
				url: '/assets/virtual-translations.js',
				seq: 1
			},
			{
				type: 'custom',
				event: MANUAL_REFRESH_EVENT_NAME
			}
		] );
	} );

	it( 'refreshes the bundle output when showing the manual refresh prompt', () => {
		const server = createBundledDevServer();
		const client = createBundledDevClient( [] );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'bundled-dev-update',
			changedIds: [ '/packages/ckeditor5-foo/src/foo.ts' ],
			url: '/assets/foo.js',
			seq: 1
		} );

		expect( server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput ).toHaveBeenCalledOnce();
	} );

	it( 'still shows the manual refresh prompt when refreshing the bundle output fails', async () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput =
			vi.fn().mockRejectedValue( new Error( 'build output unavailable' ) );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'bundled-dev-update',
			changedIds: [ '/packages/ckeditor5-foo/src/foo.ts' ],
			url: '/assets/foo.js',
			seq: 1
		} );

		// The rejection must be swallowed; an unhandled rejection would fail the test run.
		await new Promise( resolve => setTimeout( resolve ) );

		expect( clientPayloads.at( -1 ) ).to.deep.equal( {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} );
	} );

	it( 'keeps bundled dev HTML updates sent directly to clients', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );
		const payload: HotPayload = {
			type: 'bundled-dev-update',
			changedIds: [ 'packages/ckeditor5-foo/manual/foo.manual.html' ],
			url: '/assets/foo.manual.js',
			seq: 1
		};

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( payload );

		expect( clientPayloads ).to.deep.equal( [ payload ] );
	} );

	it( 'keeps bundled dev CSS updates sent directly to clients', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );
		const payload: HotPayload = {
			type: 'bundled-dev-update',
			changedIds: [ '/packages/ckeditor5-foo/theme/foo.css?direct' ],
			url: '/assets/foo.js',
			seq: 1
		};

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( payload );

		expect( clientPayloads ).to.deep.equal( [ payload ] );
	} );

	// Empty updates keep the client's update sequence numbering intact and no-op there,
	// so they must pass through without triggering the refresh prompt.
	it( 'keeps bundled dev empty update notifications sent to clients unaffected by a change', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );
		const payload: HotPayload = {
			type: 'bundled-dev-update',
			changedIds: [],
			url: '/assets/noop.js',
			seq: 1
		};

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( payload );

		expect( clientPayloads ).to.deep.equal( [ payload ] );
	} );

	it( 'keeps non-update payloads sent directly to clients', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( { type: 'full-reload' } );

		expect( clientPayloads ).to.deep.equal( [ { type: 'full-reload' } ] );
	} );

	it( 'does not wrap the same bundled dev client more than once', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'bundled-dev-update',
			changedIds: [ '/assets/article.js' ],
			url: '/assets/article.js',
			seq: 1
		} );

		expect( clientPayloads ).to.deep.equal( [
			{
				type: 'bundled-dev-update',
				changedIds: [],
				url: '/assets/article.js',
				seq: 1
			},
			{
				type: 'custom',
				event: MANUAL_REFRESH_EVENT_NAME
			}
		] );
	} );

	it( 'force-ships manual test HTML modules from the hotUpdate hook', () => {
		const modules = [ { id: 'packages/ckeditor5-foo/manual/foo.manual.html' } ];

		expect( callHotUpdate( '/workspace/packages/ckeditor5-foo/manual/foo.manual.html', modules ) )
			.to.equal( modules );
	} );

	it( 'keeps the default hotUpdate behavior for files other than manual test HTML', () => {
		expect( callHotUpdate( '/workspace/packages/ckeditor5-foo/src/foo.ts', [ {} ] ) )
			.to.equal( undefined );
		expect( callHotUpdate( '/workspace/packages/ckeditor5-foo/manual/fixture.html', [ {} ] ) )
			.to.equal( undefined );
	} );

	it( 'runs after the Vite HTML transform, only for manual test HTML files', () => {
		const transform = refreshPlugin().transform as TransformHook;

		expect( transform.order ).to.equal( 'post' );

		// Other HTML files and the inline modules themselves are skipped.
		expect( transform.filter.id.test( MANUAL_HTML_FILE_PATH ) ).to.be.true;
		expect( transform.filter.id.test( '/workspace/packages/ckeditor5-foo/manual/fixture.html' ) ).to.be.false;
		expect( transform.filter.id.test( `${ MANUAL_HTML_FILE_PATH }?html-proxy&inline-css&index=0.css` ) ).to.be.false;
	} );

	it( 'adds a revision to the ids of the inline modules', () => {
		expect( callTransform( refreshPlugin(), MANUAL_HTML_MODULE_CODE, MANUAL_HTML_FILE_PATH )!.code ).to.equal( [
			'',
			`import "${ MANUAL_HTML_FILE_PATH }?html-rev=1&html-proxy&inline-css&index=0.css"`,
			`import "${ MANUAL_HTML_FILE_PATH }?html-rev=1&html-proxy&inline-css&style-attr&index=1.css"`,
			`import "${ MANUAL_HTML_FILE_PATH }?html-rev=1&html-proxy&index=2.js"`
		].join( '\n' ) );
	} );

	it( 'bumps the revision each time the HTML module is transformed', () => {
		const plugin = refreshPlugin();

		// Even a return to earlier content gets a new revision, because the old inline modules serve
		// the CSS of the last edit.
		expect( transformAndGetRevision( plugin, MANUAL_HTML_FILE_PATH ) ).to.equal( '1' );
		expect( transformAndGetRevision( plugin, MANUAL_HTML_FILE_PATH ) ).to.equal( '2' );
		expect( transformAndGetRevision( plugin, MANUAL_HTML_FILE_PATH ) ).to.equal( '3' );
	} );

	it( 'counts the revisions of each manual test HTML file separately', () => {
		const plugin = refreshPlugin();
		const otherHtmlFilePath = '/workspace/packages/ckeditor5-foo/manual/bar.manual.html';

		transformAndGetRevision( plugin, otherHtmlFilePath );

		expect( transformAndGetRevision( plugin, MANUAL_HTML_FILE_PATH ) ).to.equal( '1' );
		expect( transformAndGetRevision( plugin, otherHtmlFilePath ) ).to.equal( '2' );
	} );

	it( 'does not change the module code or bump the revision when the HTML has no inline modules', () => {
		const plugin = refreshPlugin();

		expect( callTransform( plugin, '\nimport "./foo.js"', MANUAL_HTML_FILE_PATH ) ).to.equal( undefined );
		expect( transformAndGetRevision( plugin, MANUAL_HTML_FILE_PATH ) ).to.equal( '1' );
	} );

	describe( 'in the bundled dev server', () => {
		let server: ViteDevServer | undefined;
		let workspaceRoot: string;

		beforeEach( async () => {
			workspaceRoot = await createTemporaryDirectory( 'ckeditor5-manual-refresh-plugin-' );
		} );

		afterEach( async () => {
			await server?.close();
			server = undefined;

			await removeDirectory( workspaceRoot );
		} );

		// The initial build and two rebuilds may not fit in the default test timeout.
		it( 'serves the current inline styles after edits that change only the inline styles', { timeout: 20000 }, async () => {
			const relativePath = 'packages/ckeditor5-foo/manual/foo.manual.html';
			const oldHtml = '<!DOCTYPE html><head><style>h2 { color: red; }</style>' +
				'<script type="module" src="./foo.js"></script></head><body><h2>Foo</h2></body>';
			const newHtml = oldHtml.replace( 'color: red', 'color: blue' );

			const [ htmlFilePath ] = await Promise.all( [
				createFile( workspaceRoot, relativePath, oldHtml ),
				createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/foo.js', 'console.log( 1 );' )
			] );

			server = await createServer( {
				root: workspaceRoot,
				appType: 'mpa',
				configFile: false,
				logLevel: 'silent',
				experimental: {
					bundledDev: true
				},
				server: {
					port: 0
				},
				build: {
					rolldownOptions: {
						input: [ htmlFilePath ]
					}
				},
				plugins: [
					refreshPlugin()
				]
			} );

			await server.listen();

			const pageUrl = new URL( relativePath, server.resolvedUrls!.local[ 0 ]! );

			await waitForHtml( pageUrl, 'color: red' );

			// Without the revision in the inline module ids, the server keeps serving `color: red` here.
			await updateFile( server, workspaceRoot, relativePath, newHtml );
			await waitForHtml( pageUrl, 'color: blue' );

			// Returning to earlier content must not bring back the CSS of the previous edit.
			await updateFile( server, workspaceRoot, relativePath, oldHtml );
			await waitForHtml( pageUrl, 'color: red' );
		} );
	} );

	function callTransform( plugin: Plugin, code: string, id: string ): { code: string; map: null } | undefined {
		return ( plugin.transform as TransformHook ).handler( code, id );
	}

	// Transforms the HTML module of the given file and returns the revision added to its inline module ids.
	function transformAndGetRevision( plugin: Plugin, id: string ): string | undefined {
		const code = callTransform( plugin, MANUAL_HTML_MODULE_CODE.replaceAll( MANUAL_HTML_FILE_PATH, id ), id )!.code;

		return /\?html-rev=(\d+)&html-proxy&inline-css&index=0\.css"/.exec( code )?.[ 1 ];
	}

	function callHotUpdate( file: string, modules: Array<unknown> ): Array<unknown> | undefined {
		const hotUpdate = refreshPlugin().hotUpdate as unknown as (
			options: { file: string; modules: Array<unknown> }
		) => Array<unknown> | undefined;

		return hotUpdate( { file, modules } );
	}

	// Mirrors the Vite 8.2.2 layout: the patched internals live on the `BundledDev` helper
	// exposed as `server.environments.client.bundledDev`.
	function createBundledDevServer() {
		return {
			environments: {
				client: {
					bundledDev: {
						clients: {
							setupIfNeeded: vi.fn()
						},
						devEngine: {
							ensureLatestBuildOutput: vi.fn().mockResolvedValue( undefined )
						}
					}
				}
			}
		};
	}

	function createBundledDevClient( clientPayloads: Array<HotPayload> ) {
		return {
			send: ( payload: HotPayload ) => {
				clientPayloads.push( payload );
			}
		};
	}
} );

// Waits for the built page. During the first build, Vite serves a fallback page instead,
// which inlines its client code and could contain the expected text.
async function waitForHtml( url: URL, expectedText: string ): Promise<void> {
	await vi.waitFor( async () => {
		const html = await ( await fetch( url ) ).text();

		expect( html ).to.not.contain( '__vite_is_fallback_page__' );
		expect( html ).to.contain( expectedText );
	}, { timeout: 5000 } );
}
