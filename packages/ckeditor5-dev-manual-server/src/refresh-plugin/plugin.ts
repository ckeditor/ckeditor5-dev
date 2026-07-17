/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Why monkey-patch instead of using the documented `hotUpdate` plugin hook?
//
// Spike result (2026-07-02, Vite 8.1.0): under `experimental.bundledDev`, Vite's
// `handleHMRUpdate()` early-returns on `config.experimental.bundledDev` BEFORE it
// ever reaches the plugin hook loop, so `hotUpdate`/`handleHotUpdate` are never
// invoked. Bundled dev HMR instead runs entirely on a separate rolldown dev-engine
// path (`onHmrUpdates` → `handleHmrOutput` → `client.send`) that has no plugin
// extension point today. A control run with `bundledDev` disabled confirmed the
// documented `hotUpdate` hook + suppression + custom events all work fine there —
// this file only needs to reach for undocumented internals because `bundledDev`
// must stay enabled.
//
// This plugin targets the Vite 8.1+ internals: the `BundledDev` helper exposed as
// `server.environments.client.bundledDev`, carrying `clients`, `handleHmrOutput`
// and `devEngine`. Because these internals are undocumented, they move without
// notice — in Vite 8.0.x the very same members lived directly on the client
// environment. When a Vite upgrade relocates them again, the patches below turn
// into no-ops and manual tests regress to full page reloads on every JS edit
// (losing editor state) instead of showing the refresh prompt.
//
// Revisit this plugin (and delete the patches below) once Vite exposes HMR plugin
// hooks for bundled dev.

import { relative } from 'node:path';
import type { Plugin, HotPayload } from 'vite';
import { toPosixPath } from '../utils.js';

export const MANUAL_REFRESH_EVENT_NAME = 'ckeditor5-manual:refresh-available';

const isManualRefreshWrappedClient = Symbol( 'isManualRefreshWrappedClient' );

/**
 * The undocumented `BundledDev` internals this plugin patches, exposed as
 * `server.environments.client.bundledDev` in Vite 8.1+.
 */
interface BundledDevInternals {
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

interface BundledDevClientEnvironment {
	bundledDev?: BundledDevInternals;
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
			const clientEnvironment = server.environments.client as unknown as BundledDevClientEnvironment;
			const bundledDev = clientEnvironment.bundledDev;

			if ( !bundledDev ) {
				return;
			}

			wrapBundledDevClientSend( bundledDev.clients );
			wrapBundledDevFullReloads( bundledDev, server.config.root );
		}
	};
}

function wrapBundledDevClientSend( clients: BundledDevInternals[ 'clients' ] ): void {
	if ( !clients || typeof clients.setupIfNeeded != 'function' ) {
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

function wrapBundledDevFullReloads( bundledDev: BundledDevInternals, workspaceRoot: string ): void {
	if ( typeof bundledDev.handleHmrOutput != 'function' ) {
		return;
	}

	const handleHmrOutput = bundledDev.handleHmrOutput.bind( bundledDev );

	bundledDev.handleHmrOutput = ( client, files, hmrOutput, invalidateInformation ) => {
		if ( hmrOutput.type != 'FullReload' ) {
			return handleHmrOutput( client, files, hmrOutput, invalidateInformation );
		}

		if ( !shouldShowManualRefreshPromptForFiles( files ) ) {
			// Vite invokes this synchronous handler without awaiting its result.
			reloadClientAfterLatestBuildOutput( bundledDev, client, files, workspaceRoot );

			return;
		}

		ensureLatestBuildOutput( bundledDev );

		client.send( {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} );
	};
}

async function reloadClientAfterLatestBuildOutput(
	bundledDev: BundledDevInternals,
	client: BundledDevClient,
	files: Array<string>,
	workspaceRoot: string
): Promise<void> {
	try {
		await bundledDev.devEngine?.ensureLatestBuildOutput();
	} catch {
		// Reload using the best output available instead of leaving the page stale.
	}

	client.send( {
		type: 'full-reload',
		path: getChangedHtmlPublicPath( files, workspaceRoot )
	} );
}

function getChangedHtmlPublicPath( files: Array<string>, workspaceRoot: string ): string | undefined {
	const htmlFile = files.find( file => file.endsWith( '.html' ) );

	return htmlFile ? `/${ toPosixPath( relative( workspaceRoot, htmlFile ) ) }` : undefined;
}

function ensureLatestBuildOutput( bundledDev: BundledDevInternals ): void {
	try {
		bundledDev.devEngine?.ensureLatestBuildOutput().catch( () => {} );
	} catch {
		// The `devEngine` getter throws until initialized. An HMR update arriving before
		// that is unlikely, but do not let it break the update handling.
	}
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
	return payload.type == 'update' && payload.updates.length > 0 && payload.updates.every( update => {
		return update.type == 'css-update' || ( update.type == 'js-update' && update.acceptedPath.endsWith( '.css' ) );
	} );
}

function shouldShowManualRefreshPromptForFiles( files: Array<string> ): boolean {
	return files.some( file => !file.endsWith( '.css' ) && !file.endsWith( '.html' ) );
}
