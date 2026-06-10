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
		server.environments.client.clients.setupIfNeeded( client, 'client-1' );
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
		server.environments.client.clients.setupIfNeeded( client, 'client-1' );
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

	test( 'replaces bundled dev JavaScript full reloads with the manual refresh prompt', () => {
		const clientPayloads: Array<HotPayload> = [];
		const handledFullReloads: Array<Array<string>> = [];
		const server = createBundledDevServer( handledFullReloads );
		const client = createBundledDevClient( clientPayloads );

		configureServer( server );
		server.environments.client.handleHmrOutput( client, [ '/workspace/article.js' ], { type: 'FullReload' } );

		expect( handledFullReloads ).to.deep.equal( [] );
		expect( server.environments.client.devEngine.ensureLatestBuildOutput ).toHaveBeenCalledOnce();
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
		server.environments.client.handleHmrOutput( client, [ '/workspace/article.html' ], { type: 'FullReload' } );

		expect( handledFullReloads ).to.deep.equal( [ [ '/workspace/article.html' ] ] );
		expect( server.environments.client.devEngine.ensureLatestBuildOutput ).not.toHaveBeenCalled();
		expect( clientPayloads ).to.deep.equal( [] );
	} );

	function createBundledDevServer( handledFullReloads: Array<Array<string>> = [] ) {
		return {
			environments: {
				client: {
					clients: {
						setupIfNeeded: vi.fn()
					},
					devEngine: {
						ensureLatestBuildOutput: vi.fn().mockResolvedValue( undefined )
					},
					handleHmrOutput: vi.fn<( client: unknown, files: Array<string>, hmrOutput: unknown ) => void>( ( _client, files ) => {
						handledFullReloads.push( files );
					} ),
					initialBuildCompleted: true
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
