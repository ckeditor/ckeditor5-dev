/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, afterEach, beforeEach } from 'vitest';
import { type HotPayload, type ViteDevServer } from 'vite';
import { refreshPlugin, MANUAL_REFRESH_EVENT_NAME } from '../../src/refresh-plugin/plugin.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import {
	collectHotPayloads,
	createTestServer,
	getPayloadsByType,
	updateFile,
	waitForPayload
} from '../_utils/vite.js';

describe( 'refreshPlugin()', () => {
	let server: ViteDevServer | undefined;
	let workspaceRoot: string;
	let hotPayloads: Array<{ payload: HotPayload }>;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-refresh-plugin-' );
		hotPayloads = [];
	} );

	afterEach( async () => {
		await server?.close();
		server = undefined;

		await removeDirectory( workspaceRoot );
	} );

	test( 'applies only in the dev server', () => {
		expect( refreshPlugin().apply ).to.equal( 'serve' );
	} );

	test( 'keeps regular Vite HMR for CSS file updates', async () => {
		await createFile( workspaceRoot, 'index.html', '<script type="module" src="/main.js"></script>' );
		await createFile( workspaceRoot, 'main.js', 'import "./styles.css";' );
		await createFile( workspaceRoot, 'styles.css', 'body { color: red; }' );
		server = await createRefreshTestServer();

		await server.transformRequest( '/styles.css?import' );
		await updateFile( server, workspaceRoot, 'styles.css', 'body { color: green; }' );
		await waitForPayload( hotPayloads, payload => payload.type == 'update' );

		expect( getPayloadsByType( hotPayloads, 'custom' ) ).to.deep.equal( [] );
	} );

	test( 'shows only the manual refresh prompt for non-CSS updates', async () => {
		await createFile( workspaceRoot, 'index.html', '<script type="module" src="/main.js"></script>' );
		await createFile( workspaceRoot, 'main.js', 'window.manualTest = true;' );
		server = await createRefreshTestServer();

		await server.transformRequest( '/main.js' );
		await updateFile( server, workspaceRoot, 'main.js', 'window.manualTest = false;' );
		await waitForPayload( hotPayloads, isManualRefreshPayload );

		expect( getPayloadsByType( hotPayloads, 'update' ) ).to.deep.equal( [] );
		expect( getPayloadsByType( hotPayloads, 'full-reload' ) ).to.deep.equal( [] );
	} );

	test( 'allows Vite to reload HTML page updates', async () => {
		await createFile( workspaceRoot, 'index.html', '<script type="module" src="/main.js"></script>' );
		await createFile( workspaceRoot, 'main.js', 'window.manualTest = true;' );
		server = await createRefreshTestServer();

		await updateFile( server, workspaceRoot, 'index.html', '<script type="module" src="/main.js"></script><p>Changed</p>' );
		await waitForPayload( hotPayloads, isManualRefreshPayload );
		await waitForPayload( hotPayloads, payload => payload.type == 'full-reload' );

		expect( getPayloadsByType( hotPayloads, 'full-reload' ) ).to.have.length( 1 );
	} );

	async function createRefreshTestServer(): Promise<ViteDevServer> {
		const viteServer = await createTestServer( {
			root: workspaceRoot,
			appType: 'mpa',
			plugins: [
				refreshPlugin()
			]
		} );

		hotPayloads = collectHotPayloads( viteServer );

		return viteServer;
	}

	function isManualRefreshPayload( payload: HotPayload ): boolean {
		return payload.type == 'custom' && payload.event == MANUAL_REFRESH_EVENT_NAME;
	}
} );
