/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { rawPlugin } from '../../src/raw-plugin/plugin.js';
import type { PluginContext } from 'rollup';

interface RawPluginLoadResult {
	code: string;
	map: null;
}

type ResolveIdHook = ( this: PluginContext, source: string, importer?: string ) => Promise<string | null>;
type LoadHook = ( id: string ) => Promise<RawPluginLoadResult | null>;

describe( 'rawPlugin()', () => {
	let temporaryDirectory: string;

	beforeEach( async () => {
		temporaryDirectory = await mkdtemp( path.join( os.tmpdir(), 'ckeditor5-raw-plugin-' ) );
	} );

	afterEach( async () => {
		await rm( temporaryDirectory, { recursive: true, force: true } );
	} );

	test( 'runs before Vite built-in HTML handling', () => {
		expect( rawPlugin().enforce ).to.equal( 'pre' );
	} );

	test( 'resolves imported HTML files as raw JavaScript modules by default', async () => {
		const plugin = rawPlugin();
		const htmlFilePath = path.join( temporaryDirectory, 'template.html' );
		const importer = path.join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;
		const load = plugin.load as LoadHook;

		await writeFile( htmlFilePath, '<div class="sample">Text</div>' );

		const resolvedHtmlId = await resolveId.call( createPluginContext( htmlFilePath ), './template.html', importer );

		expect( await load( resolvedHtmlId! ) ).to.deep.equal( {
			code: 'export default "<div class=\\"sample\\">Text</div>";',
			map: null
		} );
	} );

	test( 'does not resolve SVG files by default', async () => {
		const plugin = rawPlugin();
		const filePath = path.join( temporaryDirectory, 'icon.svg' );
		const importer = path.join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( filePath, '<svg><path d="M0 0" /></svg>' );

		expect( await resolveId.call( createPluginContext( filePath ), './icon.svg', importer ) ).to.be.null;
	} );

	test( 'does not load plain HTML files directly', async () => {
		const plugin = rawPlugin();
		const filePath = path.join( temporaryDirectory, 'manual.html' );
		const load = plugin.load as LoadHook;

		await writeFile( filePath, '<p>Manual test page</p>' );

		expect( await load( filePath ) ).to.be.null;
	} );

	test( 'does not resolve HTML entry points without an importer', async () => {
		const plugin = rawPlugin();
		const filePath = path.join( temporaryDirectory, 'manual.html' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		expect( await resolveId.call( createPluginContext( filePath ), filePath ) ).to.be.null;
	} );

	test( 'ignores files with unsupported extensions', async () => {
		const plugin = rawPlugin();
		const filePath = path.join( temporaryDirectory, 'script.js' );
		const importer = path.join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( filePath, 'export default 1;' );

		expect( await resolveId.call( createPluginContext( filePath ), './script.js', importer ) ).to.be.null;
	} );

	test( 'supports custom extensions without leading dots', async () => {
		const plugin = rawPlugin( [ 'txt' ] );
		const filePath = path.join( temporaryDirectory, 'sample.txt' );
		const importer = path.join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;
		const load = plugin.load as LoadHook;

		await writeFile( filePath, 'Raw text' );

		const resolvedId = await resolveId.call( createPluginContext( filePath ), './sample.txt', importer );

		expect( await load( resolvedId! ) ).to.deep.equal( {
			code: 'export default "Raw text";',
			map: null
		} );
	} );

	test( 'ignores imports with explicit request queries', async () => {
		const plugin = rawPlugin();
		const filePath = path.join( temporaryDirectory, 'template.html' );
		const importer = path.join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( filePath, '<p>Query</p>' );

		expect( await resolveId.call( createPluginContext( filePath ), './template.html?url', importer ) ).to.be.null;
	} );
} );

function createPluginContext( resolvedId: string ): PluginContext {
	return {
		resolve: async () => ( { id: resolvedId } )
	} as unknown as PluginContext;
}
