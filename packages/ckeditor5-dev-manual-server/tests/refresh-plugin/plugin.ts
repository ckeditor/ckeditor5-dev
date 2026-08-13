/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import type { HotPayload } from 'vite';
import { refreshPlugin, MANUAL_REFRESH_EVENT_NAME } from '../../src/refresh-plugin/plugin.js';

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

	it( 'replaces bundled dev JavaScript full reloads with the manual refresh prompt', () => {
		const clientPayloads: Array<HotPayload> = [];
		const handledFullReloads: Array<Array<string>> = [];
		const server = createBundledDevServer( handledFullReloads );
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.handleHmrOutput( client, [ '/workspace/article.js' ], { type: 'FullReload' } );

		expect( handledFullReloads ).to.deep.equal( [] );
		expect( server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput ).toHaveBeenCalledOnce();
		expect( clientPayloads ).to.deep.equal( [ {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} ] );
	} );

	it( 'still shows the manual refresh prompt when refreshing the build output fails', async () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput =
			vi.fn().mockRejectedValue( new Error( 'build output unavailable' ) );

		configureServer( server );
		server.environments.client.bundledDev.handleHmrOutput( client, [ '/workspace/article.js' ], { type: 'FullReload' } );

		// The rejection must be swallowed; an unhandled rejection would fail the test run.
		await new Promise( resolve => setTimeout( resolve ) );

		expect( clientPayloads ).to.deep.equal( [ {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} ] );
	} );

	it( 'sends bundled dev HTML full reloads only to the affected client', async () => {
		const clientPayloads: Array<HotPayload> = [];
		const otherClientPayloads: Array<HotPayload> = [];
		const handledFullReloads: Array<Array<string>> = [];
		const server = createBundledDevServer( handledFullReloads );
		const client = createBundledDevClient( clientPayloads );
		const otherClient = createBundledDevClient( otherClientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		server.environments.client.bundledDev.clients.setupIfNeeded( otherClient, 'client-2' );
		server.environments.client.bundledDev.handleHmrOutput( client, [ '/workspace/article.html' ], { type: 'FullReload' } );
		await vi.waitFor( () => expect( clientPayloads ).to.have.length( 1 ) );

		expect( handledFullReloads ).to.deep.equal( [] );
		expect( server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput ).toHaveBeenCalledOnce();
		expect( clientPayloads ).to.deep.equal( [ {
			type: 'full-reload',
			path: '/article.html'
		} ] );
		expect( otherClientPayloads ).to.deep.equal( [] );
	} );

	it( 'sends bundled dev CSS full reloads only to the affected client', async () => {
		const clientPayloads: Array<HotPayload> = [];
		const handledFullReloads: Array<Array<string>> = [];
		const server = createBundledDevServer( handledFullReloads );
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		server.environments.client.bundledDev.handleHmrOutput( client, [ '/workspace/styles.css' ], { type: 'FullReload' } );
		await vi.waitFor( () => expect( clientPayloads ).to.have.length( 1 ) );

		expect( handledFullReloads ).to.deep.equal( [] );
		expect( server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput ).toHaveBeenCalledOnce();
		expect( clientPayloads ).to.deep.equal( [ {
			type: 'full-reload',
			path: undefined
		} ] );
	} );

	it( 'reloads the affected client when refreshing the build output fails', async () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput =
			vi.fn().mockRejectedValue( new Error( 'build output unavailable' ) );

		configureServer( server );
		server.environments.client.bundledDev.handleHmrOutput( client, [ '/workspace/article.html' ], { type: 'FullReload' } );
		await vi.waitFor( () => expect( clientPayloads ).to.have.length( 1 ) );

		expect( clientPayloads ).to.deep.equal( [ {
			type: 'full-reload',
			path: '/article.html'
		} ] );
	} );

	it( 'keeps bundled dev output other than full reloads', () => {
		const server = createBundledDevServer();
		const client = createBundledDevClient( [] );
		const handleHmrOutput = server.environments.client.bundledDev.handleHmrOutput;
		const hmrOutput = { type: 'Patch' };

		configureServer( server );
		server.environments.client.bundledDev.handleHmrOutput(
			client,
			[ '/workspace/article.css' ],
			hmrOutput
		);

		expect( handleHmrOutput ).toHaveBeenCalledExactlyOnceWith(
			client,
			[ '/workspace/article.css' ],
			hmrOutput
		);
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

	function callHotUpdate( file: string, modules: Array<unknown> ): Array<unknown> | undefined {
		const hotUpdate = refreshPlugin().hotUpdate as unknown as (
			options: { file: string; modules: Array<unknown> }
		) => Array<unknown> | undefined;

		return hotUpdate( { file, modules } );
	}

	// Mirrors the Vite 8.2.1 layout: the patched internals live on the `BundledDev` helper
	// exposed as `server.environments.client.bundledDev`.
	function createBundledDevServer( handledFullReloads: Array<Array<string>> = [] ) {
		return {
			config: {
				root: '/workspace'
			},
			environments: {
				client: {
					bundledDev: {
						clients: {
							setupIfNeeded: vi.fn()
						},
						devEngine: {
							ensureLatestBuildOutput: vi.fn().mockResolvedValue( undefined )
						},
						handleHmrOutput: vi.fn<( client: unknown, files: Array<string>, hmrOutput: unknown ) => void>(
							( _client, files ) => {
								handledFullReloads.push( files );
							}
						),
						initialBuildCompleted: true
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
