/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { type ViteDevServer } from 'vite';
import { rawHtmlPlugin } from '../../src/raw-plugin/plugin.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import { createTestServer, getCode } from '../_utils/vite.js';

describe( 'rawHtmlPlugin()', () => {
	let server: ViteDevServer | undefined;
	let temporaryDirectory: string;

	beforeEach( async () => {
		temporaryDirectory = await createTemporaryDirectory( 'ckeditor5-raw-plugin-' );
	} );

	afterEach( async () => {
		await server?.close();
		server = undefined;

		await removeDirectory( temporaryDirectory );
	} );

	test( 'runs before Vite built-in HTML handling', () => {
		expect( rawHtmlPlugin().enforce ).to.equal( 'pre' );
	} );

	test( 'resolves imported HTML files as Vite raw imports by default', async () => {
		const importer = join( temporaryDirectory, 'manual.js' );

		await createFile( temporaryDirectory, 'template.html', '<div class="sample">Text</div>' );
		await createFile( temporaryDirectory, 'manual.js', 'import template from "./template.html";' );
		server = await createRawTestServer();

		expect( ( await server.pluginContainer.resolveId( './template.html', importer ) )!.id )
			.to.equal( join( temporaryDirectory, 'template.html?raw' ) );
	} );

	test( 'loads imported HTML files as raw strings', async () => {
		const importer = join( temporaryDirectory, 'manual.js' );

		await createFile( temporaryDirectory, 'template.html', '<p>Template</p>' );
		await createFile( temporaryDirectory, 'manual.js', 'import template from "./template.html";' );
		server = await createRawTestServer();

		const resolved = await server.pluginContainer.resolveId( './template.html', importer );
		const loaded = await server.pluginContainer.load( resolved!.id );

		expect( getCode( loaded ) ).to.contain( 'export default "<p>Template</p>"' );
	} );

	test( 'does not resolve SVG files by default', async () => {
		const importer = join( temporaryDirectory, 'manual.js' );

		await createFile( temporaryDirectory, 'icon.svg', '<svg><path d="M0 0" /></svg>' );
		await createFile( temporaryDirectory, 'manual.js', 'import icon from "./icon.svg";' );
		server = await createRawTestServer();

		expect( ( await server.pluginContainer.resolveId( './icon.svg', importer ) )!.id )
			.to.equal( join( temporaryDirectory, 'icon.svg' ) );
	} );

	test( 'does not affect HTML documents transformed by Vite', async () => {
		await createFile( temporaryDirectory, 'manual.html', '<p>Manual test</p>' );
		server = await createRawTestServer();

		expect( await server.transformIndexHtml( '/manual.html', '<p>Manual test</p>' ) )
			.to.contain( '<p>Manual test</p>' );
	} );

	test( 'does not resolve HTML imports that Vite cannot resolve', async () => {
		const importer = join( temporaryDirectory, 'manual.js' );

		await createFile( temporaryDirectory, 'manual.js', 'import template from "./missing.html";' );
		server = await createRawTestServer();

		expect( await server.pluginContainer.resolveId( './missing.html', importer ) ).to.be.null;
	} );

	test( 'ignores files with unsupported extensions', async () => {
		const importer = join( temporaryDirectory, 'manual.js' );

		await createFile( temporaryDirectory, 'script.js', 'export default 1;' );
		await createFile( temporaryDirectory, 'manual.js', 'import value from "./script.js";' );
		server = await createRawTestServer();

		expect( ( await server.pluginContainer.resolveId( './script.js', importer ) )!.id )
			.to.equal( join( temporaryDirectory, 'script.js' ) );
	} );

	test( 'ignores imports with explicit request queries', async () => {
		const importer = join( temporaryDirectory, 'manual.js' );

		await createFile( temporaryDirectory, 'template.html', '<p>Query</p>' );
		await createFile( temporaryDirectory, 'manual.js', 'import templateUrl from "./template.html?url";' );
		server = await createRawTestServer();

		expect( ( await server.pluginContainer.resolveId( './template.html?url', importer ) )!.id )
			.to.equal( join( temporaryDirectory, 'template.html?url' ) );
	} );

	async function createRawTestServer(): Promise<ViteDevServer> {
		return createTestServer( {
			root: temporaryDirectory,
			plugins: [
				rawHtmlPlugin()
			]
		} );
	}
} );
