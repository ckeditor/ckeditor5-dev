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
// environment, and the 8.0 → 8.1 relocation silently turned the patches below
// into no-ops until a startup assertion caught it. That is why `configureServer`
// verifies on every startup that the patched internals still exist and warns
// loudly when they do not, so an upstream Vite bump fails visibly instead of
// silently regressing to full page reloads.
//
// Revisit this plugin (and delete the patches below) once Vite exposes HMR plugin
// hooks for bundled dev.

import type { Plugin, ViteDevServer, HotPayload } from 'vite';

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
			const missing: Array<string> = [];

			if ( !bundledDev ) {
				missing.push( 'bundledDev' );
			} else {
				if ( !wrapBundledDevClientSend( bundledDev.clients ) ) {
					missing.push( 'bundledDev.clients.setupIfNeeded' );
				}

				if ( !wrapBundledDevFullReloads( bundledDev ) ) {
					missing.push( 'bundledDev.handleHmrOutput' );
				}

				if ( !( 'devEngine' in bundledDev ) ) {
					missing.push( 'bundledDev.devEngine' );
				}
			}

			warnAboutMissingBundledDevInternals( server, missing );
		}
	};
}

/**
 * `ckeditor5-manual-refresh` patches undocumented bundled dev internals (see the file header
 * comment for why). Those internals can disappear or be renamed by any Vite upgrade without
 * a semver-visible signal — exactly what happened between Vite 8.0.x and 8.1.0. This check
 * runs on every dev server startup and, when an internal is missing, logs a loud, actionable
 * warning instead of failing silently into full page reloads on every JS edit.
 */
function warnAboutMissingBundledDevInternals( server: ViteDevServer, missing: Array<string> ): void {
	if ( missing.length == 0 ) {
		return;
	}

	const warn = server.config?.logger?.warn ?? console.warn;

	warn(
		'[ckeditor5-manual-refresh] The following undocumented Vite internal(s) this plugin ' +
		`relies on are missing on \`server.environments.client\`: ${ missing.join( ', ' ) }. ` +
		'This plugin requires Vite 8.1+ with `experimental.bundledDev` enabled, so this likely ' +
		'means Vite was upgraded and changed its internal implementation. ' +
		'The manual test "refresh available" prompt is now degraded: JavaScript edits will ' +
		'trigger full page reloads (losing editor state) instead of the prompt. ' +
		'See src/refresh-plugin/plugin.ts in @ckeditor/ckeditor5-dev-manual-server for details ' +
		'and update the patched internals to match the new Vite version.'
	);
}

function wrapBundledDevClientSend( clients: BundledDevInternals[ 'clients' ] ): boolean {
	if ( !clients || typeof clients.setupIfNeeded != 'function' ) {
		return false;
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

	return true;
}

function wrapBundledDevFullReloads( bundledDev: BundledDevInternals ): boolean {
	if ( typeof bundledDev.handleHmrOutput != 'function' ) {
		return false;
	}

	const handleHmrOutput = bundledDev.handleHmrOutput.bind( bundledDev );

	bundledDev.handleHmrOutput = ( client, files, hmrOutput, invalidateInformation ) => {
		if ( hmrOutput.type == 'FullReload' && shouldShowManualRefreshPromptForFiles( files ) ) {
			ensureLatestBuildOutput( bundledDev );

			client.send( {
				type: 'custom',
				event: MANUAL_REFRESH_EVENT_NAME
			} );

			return;
		}

		return handleHmrOutput( client, files, hmrOutput, invalidateInformation );
	};

	return true;
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
