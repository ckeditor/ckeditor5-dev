/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { HotPayload, Plugin } from 'vite';

export const MANUAL_REFRESH_EVENT_NAME = 'ckeditor5-manual:refresh-available';

const isManualRefreshWrappedClient = Symbol( 'isManualRefreshWrappedClient' );

interface BundledDevClientEnvironment {
	clients?: {
		setupIfNeeded( client: BundledDevClient, clientId: string ): unknown;
	};
	devEngine?: {
		ensureLatestBuildOutput(): Promise<unknown>;
	};
	handleHmrOutput?(
		client: BundledDevClient,
		files: Array<string>,
		hmrOutput: BundledDevHmrOutput,
		invalidateInformation?: unknown
	): unknown;
}

interface BundledDevClient {
	send( payload: HotPayload ): void;
	[ isManualRefreshWrappedClient ]?: boolean;
}

interface BundledDevHmrOutput {
	type: string;
}

export function refreshPlugin(): Plugin {
	return {
		name: 'ckeditor5-manual-refresh',
		apply: 'serve',

		configureServer( server ) {
			const clientEnvironment = server.environments.client as typeof server.environments.client & BundledDevClientEnvironment;

			wrapBundledDevClientSend( clientEnvironment.clients );
			wrapBundledDevFullReloads( clientEnvironment );
		}
	};
}

function wrapBundledDevClientSend( clients: BundledDevClientEnvironment[ 'clients' ] ): void {
	if ( !clients ) {
		return;
	}

	const setupIfNeeded = clients.setupIfNeeded.bind( clients );

	clients.setupIfNeeded = ( client: BundledDevClient, clientId: string ) => {
		if ( !client[ isManualRefreshWrappedClient ] ) {
			const send = client.send.bind( client );

			client.send = ( payload: HotPayload ) => {
				sendManualRefreshPayload( payload, send );
			};
			client[ isManualRefreshWrappedClient ] = true;
		}

		return setupIfNeeded( client, clientId );
	};
}

function wrapBundledDevFullReloads( clientEnvironment: BundledDevClientEnvironment ): void {
	if ( !clientEnvironment.handleHmrOutput ) {
		return;
	}

	const handleHmrOutput = clientEnvironment.handleHmrOutput.bind( clientEnvironment );

	clientEnvironment.handleHmrOutput = ( client, files, hmrOutput, invalidateInformation ) => {
		if ( hmrOutput.type == 'FullReload' && shouldShowManualRefreshPromptForFiles( files ) ) {
			clientEnvironment.devEngine?.ensureLatestBuildOutput().catch( () => {} );

			client.send( {
				type: 'custom',
				event: MANUAL_REFRESH_EVENT_NAME
			} );

			return;
		}

		return handleHmrOutput( client, files, hmrOutput, invalidateInformation );
	};
}

function sendManualRefreshPayload( payload: HotPayload, send: ( payload: HotPayload ) => void ): void {
	if ( shouldShowManualRefreshPrompt( payload ) ) {
		send( {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} );

		return;
	}

	send( payload );
}

function shouldShowManualRefreshPrompt( payload: HotPayload ): boolean {
	if ( payload.type == 'update' ) {
		return !isCssUpdatePayload( payload );
	}

	return false;
}

function isCssUpdatePayload( payload: HotPayload ): boolean {
	return payload.type == 'update' && payload.updates.length > 0 && payload.updates.every( update => update.type == 'css-update' );
}

function shouldShowManualRefreshPromptForFiles( files: Array<string> ): boolean {
	return files.some( file => !file.endsWith( '.css' ) && !file.endsWith( '.html' ) );
}
