/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Under `experimental.bundledDev` (Vite 8.2.1), HMR runs on the rolldown dev-engine
// path (`onHmrUpdates` → `handleHmrOutput` → `client.send`): the server ships a patch,
// the client walks its module graph, and on a missing HMR boundary (manual tests accept
// no JS updates) it requests a rebuild and auto-reloads. This plugin turns that
// auto-reload into the refresh prompt for JS/TS changes, while CSS updates pass through
// (hot-update in place) and HTML updates pass through (auto-reload; the reloaded body
// is kept fresh by the manual test plugin's HTML splicing).
//
// The documented `hotUpdate` hook cannot implement the prompt: suppressing an update
// there skips the engine's module re-fetch (stale output after the prompt's reload),
// and letting it through auto-reloads (losing editor state). Hence the monkey-patch of
// the last mile, the per-client `client.send`. `hotUpdate` is still used to force-ship
// manual HTML edits, which the engine would otherwise drop as unchanged.
//
// The patched internals (`server.environments.client.bundledDev` with `clients`,
// `handleHmrOutput`, `devEngine`) are undocumented and move without notice; when a Vite
// upgrade relocates them, `configureServer` throws at server startup — update this
// plugin together with Vite. Delete the patches once Vite exposes an HMR plugin
// extension point for the bundled dev client payloads.

import type { Plugin, HotPayload, HotChannelClient } from 'vite';
import { toPublicFilePath } from '../utils.js';

export const MANUAL_REFRESH_EVENT_NAME = 'ckeditor5-manual:refresh-available';

/**
 * The `BundledDev` members this plugin patches. They exist at runtime but are declared
 * `private` in Vite's published types, so they are re-declared structurally here.
 */
interface BundledDevInternals {
	clients: {
		setupIfNeeded( client: HotChannelClient, clientId: string ): unknown;
	};
	devEngine: {
		ensureLatestBuildOutput(): Promise<unknown>;
	};
	handleHmrOutput( client: HotChannelClient, files: Array<string>, hmrOutput: { type: string } ): unknown;
}

const wrappedClients = new WeakSet<HotChannelClient>();

export function refreshPlugin(): Plugin {
	return {
		name: 'ckeditor5-manual-refresh',
		apply: 'serve',

		configureServer( server ) {
			const { bundledDev } = server.environments.client as unknown as { bundledDev: BundledDevInternals };

			wrapBundledDevClientSend( bundledDev );
			wrapBundledDevFullReloads( bundledDev, server.config.root );
		},

		// The page body is not part of the HTML module's JS render, so body-only edits render
		// byte-identical and the dev engine drops them without notifying any client. Returning
		// the affected modules force-ships them, which ends in an automatic full reload.
		hotUpdate( { file, modules } ) {
			if ( file.endsWith( '.manual.html' ) ) {
				return modules;
			}
		}
	};
}

function wrapBundledDevClientSend( bundledDev: BundledDevInternals ): void {
	const clients = bundledDev.clients;
	const setupIfNeeded = clients.setupIfNeeded.bind( clients );

	clients.setupIfNeeded = ( client, clientId ) => {
		if ( !wrappedClients.has( client ) ) {
			const send = client.send.bind( client );

			client.send = payload => {
				sendManualRefreshPayload( bundledDev, payload, send );
			};
			wrappedClients.add( client );
		}

		return setupIfNeeded( client, clientId );
	};
}

function wrapBundledDevFullReloads( bundledDev: BundledDevInternals, workspaceRoot: string ): void {
	const handleHmrOutput = bundledDev.handleHmrOutput.bind( bundledDev );

	bundledDev.handleHmrOutput = ( client, files, hmrOutput ) => {
		if ( hmrOutput.type != 'FullReload' ) {
			return handleHmrOutput( client, files, hmrOutput );
		}

		if ( !shouldShowManualRefreshPrompt( files ) ) {
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
	client: HotChannelClient,
	files: Array<string>,
	workspaceRoot: string
): Promise<void> {
	try {
		await bundledDev.devEngine.ensureLatestBuildOutput();
	} catch {
		// Reload using the best output available instead of leaving the page stale.
	}

	const htmlFile = files.find( file => isHtmlFile( file ) );

	client.send( {
		type: 'full-reload',
		path: htmlFile ? toPublicFilePath( htmlFile, workspaceRoot ) : undefined
	} );
}

function ensureLatestBuildOutput( bundledDev: BundledDevInternals ): void {
	try {
		bundledDev.devEngine.ensureLatestBuildOutput().catch( () => {} );
	} catch {
		// The `devEngine` getter throws until initialized. An HMR update arriving before
		// that is unlikely, but do not let it break the update handling.
	}
}

function sendManualRefreshPayload(
	bundledDev: BundledDevInternals,
	payload: HotPayload,
	send: ( payload: HotPayload ) => void
): void {
	if ( payload.type == 'bundled-dev-update' && shouldShowManualRefreshPrompt( payload.changedIds ) ) {
		// The client never sees the changed ids, so it never requests the rebuild it would
		// normally trigger — refresh the bundle output up front so the prompt's reload is fresh.
		ensureLatestBuildOutput( bundledDev );

		// Forward the update neutralized (no changed ids) instead of dropping it: the client
		// no-ops on it but still records its `seq`. A dropped update would trip the client's
		// sequence-gap safety on the next passed-through update (e.g. a CSS hot update) and
		// force a full reload, losing the editor state the prompt exists to protect.
		send( {
			...payload,
			changedIds: []
		} );

		send( {
			type: 'custom',
			event: MANUAL_REFRESH_EVENT_NAME
		} );

		return;
	}

	send( payload );
}

// CSS updates hot-update in place and HTML updates auto-reload through the client's
// boundary walk, so only JS/TS changes are turned into the refresh prompt.
function shouldShowManualRefreshPrompt( filePaths: Array<string> ): boolean {
	return filePaths.some( filePath => !isCssFile( filePath ) && !isHtmlFile( filePath ) );
}

function isCssFile( filePath: string ): boolean {
	return filePath.split( '?', 1 )[ 0 ]!.endsWith( '.css' );
}

function isHtmlFile( filePath: string ): boolean {
	return filePath.split( '?', 1 )[ 0 ]!.endsWith( '.html' );
}
