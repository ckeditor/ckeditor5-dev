/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { ViteDevServer } from 'vite';
import { rawSvgPlugin } from '../../src/svg-plugin/plugin.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import { createTestServer, getCode } from '../_utils/vite.js';

describe( 'rawSvgPlugin()', () => {
	let server: ViteDevServer | undefined;
	let temporaryDirectory: string;

	beforeEach( async () => {
		temporaryDirectory = await createTemporaryDirectory( 'ckeditor5-svg-plugin-' );
	} );

	afterEach( async () => {
		await server?.close();
		server = undefined;

		await removeDirectory( temporaryDirectory );
	} );

	test( 'runs before Vite built-in asset handling', () => {
		expect( rawSvgPlugin().enforce ).to.equal( 'pre' );
	} );

	test( 'loads SVG files as raw strings', async () => {
		const filePath = await createFile( temporaryDirectory, 'icon.svg', '<svg><path d="M0 0" /></svg>' );

		server = await createSvgTestServer();

		const loaded = await server.pluginContainer.load( filePath );

		expect( getCode( loaded ) ).to.equal( 'export default "<svg><path d=\\"M0 0\\" /></svg>";' );
	} );

	test( 'preserves the SVG viewBox attribute', async () => {
		const filePath = await createFile(
			temporaryDirectory,
			'icon.svg',
			'<svg viewBox="0 0 20 20"><path d="M0 0" /></svg>'
		);

		server = await createSvgTestServer();

		const loaded = await server.pluginContainer.load( filePath );

		expect( getCode( loaded ) ).to.contain( 'viewBox=\\"0 0 20 20\\"' );
	} );

	test( 'ignores files with unsupported extensions', async () => {
		const filePath = await createFile( temporaryDirectory, 'script.js', 'export default 1;' );

		server = await createSvgTestServer();

		expect( await server.pluginContainer.load( filePath ) ).to.equal( null );
	} );

	async function createSvgTestServer(): Promise<ViteDevServer> {
		return createTestServer( {
			root: temporaryDirectory,
			plugins: [
				rawSvgPlugin()
			]
		} );
	}
} );
