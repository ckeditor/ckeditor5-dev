/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { rawHtmlPlugin } from '../../src/raw-plugin/plugin.js';
import type { PluginContext, ResolveIdResult } from 'rollup';

type ResolveIdHook = ( this: PluginContext, source: string, importer?: string ) => Promise<ResolveIdResult>;

describe( 'rawHtmlPlugin()', () => {
	let temporaryDirectory: string;

	beforeEach( async () => {
		temporaryDirectory = await mkdtemp( join( tmpdir(), 'ckeditor5-raw-plugin-' ) );
	} );

	afterEach( async () => {
		await rm( temporaryDirectory, { recursive: true, force: true } );
	} );

	test( 'runs before Vite built-in HTML handling', () => {
		expect( rawHtmlPlugin().enforce ).to.equal( 'pre' );
	} );

	test( 'resolves imported HTML files as Vite raw imports by default', async () => {
		const plugin = rawHtmlPlugin();
		const htmlFilePath = join( temporaryDirectory, 'template.html' );
		const importer = join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( htmlFilePath, '<div class="sample">Text</div>' );

		expect( await resolveId.call( createPluginContext( `${ htmlFilePath }?raw` ), './template.html', importer ) )
			.to.equal( `${ htmlFilePath }?raw` );
	} );

	test( 'delegates raw import resolution to Vite', async () => {
		const plugin = rawHtmlPlugin();
		const htmlFilePath = join( temporaryDirectory, 'template.html' );
		const importer = join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;
		const context = createPluginContext( `${ htmlFilePath }?raw` );

		await writeFile( htmlFilePath, '<p>Template</p>' );
		await resolveId.call( context, './template.html', importer );

		expect( context.resolve ).toHaveBeenCalledWith( './template.html?raw', importer, { skipSelf: true } );
	} );

	test( 'does not resolve SVG files by default', async () => {
		const plugin = rawHtmlPlugin();
		const filePath = join( temporaryDirectory, 'icon.svg' );
		const importer = join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( filePath, '<svg><path d="M0 0" /></svg>' );

		expect( await resolveId.call( createPluginContext( filePath ), './icon.svg', importer ) ).to.be.null;
	} );

	test( 'does not resolve HTML entry points without an importer', async () => {
		const plugin = rawHtmlPlugin();
		const filePath = join( temporaryDirectory, 'manual.html' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		expect( await resolveId.call( createPluginContext( filePath ), filePath ) ).to.be.null;
	} );

	test( 'does not resolve HTML imports that Vite cannot resolve', async () => {
		const plugin = rawHtmlPlugin();
		const importer = join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		expect( await resolveId.call( createPluginContext( null ), './missing.html', importer ) ).to.be.null;
	} );

	test( 'ignores files with unsupported extensions', async () => {
		const plugin = rawHtmlPlugin();
		const filePath = join( temporaryDirectory, 'script.js' );
		const importer = join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( filePath, 'export default 1;' );

		expect( await resolveId.call( createPluginContext( filePath ), './script.js', importer ) ).to.be.null;
	} );

	test( 'ignores imports with explicit request queries', async () => {
		const plugin = rawHtmlPlugin();
		const filePath = join( temporaryDirectory, 'template.html' );
		const importer = join( temporaryDirectory, 'manual.js' );
		const resolveId = plugin.resolveId as ResolveIdHook;

		await writeFile( filePath, '<p>Query</p>' );

		expect( await resolveId.call( createPluginContext( filePath ), './template.html?url', importer ) ).to.be.null;
	} );
} );

function createPluginContext( resolvedId: string | null ): PluginContext & { resolve: ReturnType<typeof vi.fn> } {
	return {
		resolve: vi.fn( async () => resolvedId )
	} as unknown as PluginContext & { resolve: ReturnType<typeof vi.fn> };
}
