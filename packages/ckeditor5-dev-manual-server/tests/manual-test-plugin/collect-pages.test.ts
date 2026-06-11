/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { collectManualPages } from '../../src/manual-test-plugin/collect-pages.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';

describe( 'collectManualPages()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-manual-pages-' );
	} );

	afterEach( async () => {
		await removeDirectory( workspaceRoot );
	} );

	test( 'collects sorted manual page entries from package and external package paths', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.md' ),
			createFile( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.html' ),
			createFile( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.ts' )
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
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/_utils/helper.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/html-only.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/script-only.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/other/sample.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/other/sample.js' )
		] );

		expect( collectManualPages( [ 'packages/**/*.{html,js,md,ts}' ], workspaceRoot ) ).to.deep.equal( new Map() );
	} );

	test( 'collects manual pages from any package tree location matched by the patterns', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'custom/tree/ckeditor5-custom/tests/manual/sample.html' ),
			createFile( workspaceRoot, 'custom/tree/ckeditor5-custom/tests/manual/sample.ts' ),
			createFile( workspaceRoot, 'ckeditor5-top-level/tests/manual/sample.html' ),
			createFile( workspaceRoot, 'ckeditor5-top-level/tests/manual/sample.js' )
		] );

		const pages = collectManualPages( [
			'custom/tree/*/tests/manual/**/*.{html,js,md,ts}',
			'ckeditor5-top-level/tests/manual/**/*.{html,js,md,ts}'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				displayName: 'Sample',
				htmlFilePath: '/custom/tree/ckeditor5-custom/tests/manual/sample.html',
				instructionsFilePath: undefined,
				packageName: 'ckeditor5-custom',
				scriptFilePath: '/custom/tree/ckeditor5-custom/tests/manual/sample.ts',
				slug: 'sample'
			},
			{
				displayName: 'Sample',
				htmlFilePath: '/ckeditor5-top-level/tests/manual/sample.html',
				instructionsFilePath: undefined,
				packageName: 'ckeditor5-top-level',
				scriptFilePath: '/ckeditor5-top-level/tests/manual/sample.js',
				slug: 'sample'
			}
		] );
	} );

	test( 'prefers TypeScript test scripts over JavaScript scripts', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/sample.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/sample.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/sample.ts' )
		] );

		const pages = collectManualPages( [ 'packages/*/tests/manual/**/*.{html,js,md,ts}' ], workspaceRoot );

		expect( pages.get( '/packages/ckeditor5-foo/tests/manual/sample.html' )!.scriptFilePath )
			.to.equal( '/packages/ckeditor5-foo/tests/manual/sample.ts' );
	} );

	test( 'sorts manual pages by slug within the same package', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/zeta.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/zeta.ts' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/alpha.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/alpha.ts' )
		] );

		const pages = collectManualPages( [ 'packages/*/tests/manual/**/*.{html,js,md,ts}' ], workspaceRoot );

		expect( [ ...pages.values() ].map( entry => entry.slug ) ).to.deep.equal( [ 'alpha', 'zeta' ] );
	} );
} );
