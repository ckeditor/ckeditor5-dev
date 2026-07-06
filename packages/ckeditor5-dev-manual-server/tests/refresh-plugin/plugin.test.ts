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

	test( 'keeps bundled dev HTML full reloads', () => {
		const clientPayloads: Array<HotPayload> = [];
		const handledFullReloads: Array<Array<string>> = [];
		const server = createBundledDevServer( handledFullReloads );
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.bundledDev.handleHmrOutput( client, [ '/workspace/article.html' ], { type: 'FullReload' } );

		expect( handledFullReloads ).to.deep.equal( [ [ '/workspace/article.html' ] ] );
		expect( server.environments.client.bundledDev.devEngine.ensureLatestBuildOutput ).not.toHaveBeenCalled();
		expect( clientPayloads ).to.deep.equal( [] );
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

	describe( 'bundled dev internals assertion', () => {
		test( 'does not warn when every patched internal is present', () => {
			const server = createBundledDevServer();

			configureServer( server );

			expect( server.config.logger.warn ).not.toHaveBeenCalled();
		} );

		test( 'treats a `devEngine` getter that throws before initialization as present', () => {
			const server = createBundledDevServer();
			const bundledDev = server.environments.client.bundledDev as Record<string, unknown>;

			delete bundledDev.devEngine;
			Object.defineProperty( bundledDev, 'devEngine', {
				configurable: true,
				get() {
					throw new Error( 'dev engine was not yet initialized' );
				}
			} );

			expect( () => configureServer( server ) ).not.to.throw();
			expect( server.config.logger.warn ).not.toHaveBeenCalled();
		} );

		test( 'warns when the bundled dev helper is unavailable', () => {
			const server = createBundledDevServer();

			delete ( server.environments.client as Partial<typeof server.environments.client> ).bundledDev;

			configureServer( server );

			expect( server.config.logger.warn ).toHaveBeenCalledOnce();
			expect( server.config.logger.warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'bundledDev' )
			);
		} );

		test( 'warns when `clients.setupIfNeeded` is unavailable', () => {
			const server = createBundledDevServer();

			delete ( server.environments.client.bundledDev as Partial<typeof server.environments.client.bundledDev> ).clients;

			configureServer( server );

			expect( server.config.logger.warn ).toHaveBeenCalledOnce();
			expect( server.config.logger.warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'bundledDev.clients.setupIfNeeded' )
			);
		} );

		test( 'warns when `handleHmrOutput` is unavailable', () => {
			const server = createBundledDevServer();

			delete ( server.environments.client.bundledDev as Partial<typeof server.environments.client.bundledDev> ).handleHmrOutput;

			configureServer( server );

			expect( server.config.logger.warn ).toHaveBeenCalledOnce();
			expect( server.config.logger.warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'bundledDev.handleHmrOutput' )
			);
		} );

		test( 'warns when `devEngine` is unavailable', () => {
			const server = createBundledDevServer();

			delete ( server.environments.client.bundledDev as Partial<typeof server.environments.client.bundledDev> ).devEngine;

			configureServer( server );

			expect( server.config.logger.warn ).toHaveBeenCalledOnce();
			expect( server.config.logger.warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'bundledDev.devEngine' )
			);
		} );

		test( 'reports all missing internals in a single warning', () => {
			const server = createBundledDevServer();
			const bundledDev = server.environments.client.bundledDev as Partial<typeof server.environments.client.bundledDev>;

			delete bundledDev.clients;
			delete bundledDev.handleHmrOutput;
			delete bundledDev.devEngine;

			configureServer( server );

			expect( server.config.logger.warn ).toHaveBeenCalledOnce();

			const [ message ] = server.config.logger.warn.mock.calls[ 0 ]!;

			expect( message ).to.include( 'bundledDev.clients.setupIfNeeded' );
			expect( message ).to.include( 'bundledDev.handleHmrOutput' );
			expect( message ).to.include( 'bundledDev.devEngine' );
		} );

		test( 'falls back to `console.warn` when the server has no logger', () => {
			const server = createBundledDevServer();
			const consoleWarn = vi.spyOn( console, 'warn' ).mockImplementation( () => {} );

			delete ( server.environments.client as Partial<typeof server.environments.client> ).bundledDev;
			( server as { config?: unknown } ).config = undefined;

			configureServer( server );

			expect( consoleWarn ).toHaveBeenCalledOnce();

			consoleWarn.mockRestore();
		} );
	} );

	// Mirrors the Vite 8.1+ layout: the patched internals live on the `BundledDev` helper
	// exposed as `server.environments.client.bundledDev`.
	function createBundledDevServer( handledFullReloads: Array<Array<string>> = [] ) {
		return {
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
			},
			config: {
				logger: {
					warn: vi.fn()
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
