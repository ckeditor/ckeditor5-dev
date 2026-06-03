/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { manualTestsPlugin } from '../../src/manual-test-plugin/plugin.js';

type ConfigHook = ( this: unknown, config: Record<string, never>, env: { command: 'build'; mode: string } ) => TestConfig;
type ResolveIdHook = ( this: unknown, source: string, importer: string | undefined, options: Record<string, never> ) => string | null;
type LoadHook = ( this: unknown, id: string, options: Record<string, never> ) => string | null;
type TestConfig = {
	build?: {
		rolldownOptions?: {
			input?: unknown;
		};
	};
};
type TransformIndexHtmlHook = {
	handler( html: string, context: { filename: string } ): string | undefined;
};

describe( 'manualTestsPlugin()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await mkdtemp( join( tmpdir(), 'ckeditor5-manual-test-plugin-' ) );
		vi.spyOn( process, 'cwd' ).mockReturnValue( workspaceRoot );
	} );

	afterEach( async () => {
		await rm( workspaceRoot, { recursive: true, force: true } );
	} );

	test( 'uses provided broad manual test globs for page entries', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/foo.js' ),
			createFile( 'packages/ckeditor5-bar/tests/manual/bar.html' ),
			createFile( 'packages/ckeditor5-bar/tests/manual/bar.js' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/ckeditor5-foo/tests/manual/**/*' ] );
		const config = ( plugin.config as unknown as ConfigHook ).call( {}, {}, { command: 'build', mode: 'production' } );
		const input = config!.build!.rolldownOptions!.input as Array<string>;

		expect( input ).to.include( join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/foo.html' ) );
		expect( input ).not.to.include( join( workspaceRoot, 'packages/ckeditor5-bar/tests/manual/bar.html' ) );
	} );

	test( 'exposes entries collected from provided broad manual test globs', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-foo/tests/manual/foo.html' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/foo.ts' ),
			createFile( 'packages/ckeditor5-bar/tests/manual/bar.html' ),
			createFile( 'packages/ckeditor5-bar/tests/manual/bar.ts' )
		] );

		const plugin = manualTestsPlugin( [ 'packages/ckeditor5-foo/tests/manual/**/*' ] );
		const resolvedId = ( plugin.resolveId as unknown as ResolveIdHook ).call( {}, 'virtual:ckeditor5-manual-entries', undefined, {} );
		const source = ( plugin.load as unknown as LoadHook ).call( {}, resolvedId as string, {} ) as string;

		expect( source ).to.contain( '/packages/ckeditor5-foo/tests/manual/foo.html' );
		expect( source ).not.to.contain( '/packages/ckeditor5-bar/tests/manual/bar.html' );
	} );

	test( 'rewrites the catalog script to a public file path', () => {
		const plugin = manualTestsPlugin( [] );
		const transformIndexHtml = plugin.transformIndexHtml as TransformIndexHtmlHook;
		const catalogFilePath = resolve( import.meta.dirname, '../../theme/catalog.html' );
		const catalogScriptFilePath = resolve( import.meta.dirname, '../../theme/catalog.ts' ).replace( /\\/g, '/' );

		expect( transformIndexHtml.handler(
			'<script type="module" src="./catalog.ts"></script>',
			{ filename: catalogFilePath }
		) ).to.equal( `<script type="module" src="/@fs/${ catalogScriptFilePath }"></script>` );
	} );

	async function createFile( relativeFilePath: string ): Promise<void> {
		const filePath = join( workspaceRoot, relativeFilePath );

		await mkdir( dirname( filePath ), { recursive: true } );
		await writeFile( filePath, '' );
	}
} );
