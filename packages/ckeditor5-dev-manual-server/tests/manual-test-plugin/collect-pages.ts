/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { collectManualPages } from '../../src/manual-test-plugin/collect-pages.js';

describe( 'collectManualPages()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await mkdtemp( join( tmpdir(), 'ckeditor5-manual-pages-' ) );
	} );

	afterEach( async () => {
		await rm( workspaceRoot, { recursive: true, force: true } );
	} );

	test( 'collects sorted manual page entries from package and external package paths', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.html' ),
			createFile( 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.js' ),
			createFile( 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.md' ),
			createFile( 'external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.html' ),
			createFile( 'external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.ts' )
		] );

		const pages = collectManualPages( [
			'packages/*/tests/manual/**/*.{html,js,md,ts}',
			'external/ckeditor5/packages/*/tests/manual/**/*.{html,js,md,ts}'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				displayName: 'Sample',
				htmlFilePath: '/external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.html',
				instructionsFilePath: undefined,
				packageName: 'ckeditor5-alpha',
				scriptFilePath: '/external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.ts',
				slug: 'sample'
			},
			{
				displayName: 'Nested / Demo Case',
				htmlFilePath: '/packages/ckeditor5-zeta/tests/manual/nested/demo-case.html',
				instructionsFilePath: '/packages/ckeditor5-zeta/tests/manual/nested/demo-case.md',
				packageName: 'ckeditor5-zeta',
				scriptFilePath: '/packages/ckeditor5-zeta/tests/manual/nested/demo-case.js',
				slug: 'nested/demo-case'
			}
		] );
	} );

	test( 'ignores utility files, unsupported paths, and incomplete manual pages', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-foo/tests/manual/_utils/helper.js' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/html-only.html' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/script-only.js' ),
			createFile( 'packages/ckeditor5-foo/tests/other/sample.html' ),
			createFile( 'packages/ckeditor5-foo/tests/other/sample.js' )
		] );

		expect( collectManualPages( [ 'packages/**/*.{html,js,md,ts}' ], workspaceRoot ) ).to.deep.equal( new Map() );
	} );

	test( 'prefers TypeScript test scripts over JavaScript scripts', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-foo/tests/manual/sample.html' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/sample.js' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/sample.ts' )
		] );

		const pages = collectManualPages( [ 'packages/*/tests/manual/**/*.{html,js,md,ts}' ], workspaceRoot );

		expect( pages.get( '/packages/ckeditor5-foo/tests/manual/sample.html' )!.scriptFilePath )
			.to.equal( '/packages/ckeditor5-foo/tests/manual/sample.ts' );
	} );

	async function createFile( relativeFilePath: string ): Promise<void> {
		const filePath = join( workspaceRoot, relativeFilePath );

		await mkdir( dirname( filePath ), { recursive: true } );
		await writeFile( filePath, '' );
	}
} );
