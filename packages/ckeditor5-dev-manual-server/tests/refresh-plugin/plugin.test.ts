/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import type { HotPayload } from 'vite';
import { refreshPlugin, MANUAL_REFRESH_EVENT_NAME } from '../../src/refresh-plugin/plugin.js';

function configureServer( server: unknown ): void {
	( refreshPlugin().configureServer as unknown as ( server: unknown ) => void )( server );
}

describe( 'refreshPlugin()', () => {
	test( 'applies only in the dev server', () => {
		expect( refreshPlugin().apply ).to.equal( 'serve' );
	} );

	test( 'replaces bundled dev JavaScript HMR updates sent directly to clients with the manual refresh prompt', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'update',
			updates: [ {
				type: 'js-update',
				path: '/assets/article.js',
				acceptedPath: '/assets/article.js',
				timestamp: Date.now()
			} ]
		} );

		expect( clientPayloads ).to.deep.equal( [ {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} ] );
	} );

	test( 'keeps bundled dev CSS HMR updates sent directly to clients', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'update',
			updates: [ {
				type: 'css-update',
				path: '/styles.css',
				acceptedPath: '/styles.css',
				timestamp: Date.now()
			} ]
		} );

		expect( clientPayloads ).to.have.length( 1 );
		expect( clientPayloads[ 0 ]!.type ).to.equal( 'update' );
	} );

	test( 'keeps bundled dev CSS patches sent as JavaScript HMR updates directly to clients', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );
		const payload: HotPayload = {
			type: 'update',
			updates: [ {
				type: 'js-update',
				path: 'packages/foo/theme/foo.css',
				acceptedPath: 'packages/foo/theme/foo.css',
				timestamp: Date.now()
			} ]
		};

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( payload );

		expect( clientPayloads ).to.deep.equal( [ payload ] );
	} );

	test( 'drops bundled dev empty HMR updates sent to clients unaffected by a change', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'update',
			updates: []
		} );

		expect( clientPayloads ).to.deep.equal( [] );
	} );

	test( 'keeps non-update payloads sent directly to clients', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( { type: 'full-reload' } );

		expect( clientPayloads ).to.deep.equal( [ { type: 'full-reload' } ] );
	} );

	test( 'does not wrap the same bundled dev client more than once', () => {
		const clientPayloads: Array<HotPayload> = [];
		const server = createBundledDevServer();
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		server.environments.client.bundledDev.clients.setupIfNeeded( client, 'client-1' );
		client.send( {
			type: 'update',
			updates: [ {
				type: 'js-update',
				path: '/assets/article.js',
				acceptedPath: '/assets/article.js',
				timestamp: Date.now()
			} ]
		} );

		expect( clientPayloads ).to.deep.equal( [ {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} ] );
	} );

	test( 'replaces bundled dev JavaScript full reloads with the manual refresh prompt', () => {
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

	test( 'still shows the manual refresh prompt when refreshing the build output fails', async () => {
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

	test( 'sends bundled dev HTML full reloads only to the affected client', async () => {
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

	test( 'sends bundled dev CSS full reloads only to the affected client', async () => {
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

	test( 'reloads the affected client when refreshing the build output fails', async () => {
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

	test( 'keeps bundled dev output other than full reloads', () => {
		const server = createBundledDevServer();
		const client = createBundledDevClient( [] );
		const handleHmrOutput = server.environments.client.bundledDev.handleHmrOutput;
		const hmrOutput = { type: 'Patch' };
		const invalidateInformation = {};

		configureServer( server );
		( server.environments.client.bundledDev.handleHmrOutput as (
			client: unknown,
			files: Array<string>,
			hmrOutput: unknown,
			invalidateInformation?: unknown
		) => void )(
			client,
			[ '/workspace/article.css' ],
			hmrOutput,
			invalidateInformation
		);

		expect( handleHmrOutput ).toHaveBeenCalledExactlyOnceWith(
			client,
			[ '/workspace/article.css' ],
			hmrOutput,
			invalidateInformation
		);
	} );

	test( 'does not crash when the bundled dev helper is unavailable', () => {
		const server = createBundledDevServer();

		delete ( server.environments.client as Partial<typeof server.environments.client> ).bundledDev;

		expect( () => configureServer( server ) ).not.to.throw();
	} );

	test( 'does not crash when bundled dev clients are unavailable', () => {
		const server = createBundledDevServer();

		delete ( server.environments.client.bundledDev as Partial<typeof server.environments.client.bundledDev> ).clients;

		expect( () => configureServer( server ) ).not.to.throw();
	} );

	test( 'does not crash when bundled dev HMR handling is unavailable', () => {
		const server = createBundledDevServer();

		delete ( server.environments.client.bundledDev as Partial<typeof server.environments.client.bundledDev> ).handleHmrOutput;

		expect( () => configureServer( server ) ).not.to.throw();
	} );

	// Mirrors the Vite 8.1+ layout: the patched internals live on the `BundledDev` helper
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
