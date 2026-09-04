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
