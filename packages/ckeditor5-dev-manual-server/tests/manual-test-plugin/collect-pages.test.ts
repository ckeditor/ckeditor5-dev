/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { basename } from 'node:path';
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

	test( 'collects sorted manual page entries from package root globs', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.manual.html' ),
			createFile( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.manual.html' )
		] );

		const pages = collectManualPages( [
			'packages/*',
			'external/ckeditor5/packages/*'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				htmlFilePath: '/external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.manual.html',
				packageName: 'ckeditor5-alpha',
				slug: 'sample'
			},
			{
				htmlFilePath: '/packages/ckeditor5-zeta/tests/manual/nested/demo-case.manual.html',
				packageName: 'ckeditor5-zeta',
				slug: 'nested/demo-case'
			}
		] );
	} );

	test( 'ignores plain .html fixtures and files outside tests/manual', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/_utils/helper.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/fixture.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/script-only.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/other/sample.manual.html' )
		] );

		expect( collectManualPages( [ 'packages/*' ], workspaceRoot ) ).to.deep.equal( new Map() );
	} );

	test( 'collects manual pages from any package tree location matched by the patterns', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'custom/tree/ckeditor5-custom/tests/manual/sample.manual.html' ),
			createFile( workspaceRoot, 'ckeditor5-top-level/tests/manual/sample.manual.html' )
		] );

		const pages = collectManualPages( [
			'custom/tree/*',
			'ckeditor5-top-level'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				htmlFilePath: '/custom/tree/ckeditor5-custom/tests/manual/sample.manual.html',
				packageName: 'ckeditor5-custom',
				slug: 'sample'
			},
			{
				htmlFilePath: '/ckeditor5-top-level/tests/manual/sample.manual.html',
				packageName: 'ckeditor5-top-level',
				slug: 'sample'
			}
		] );
	} );

	test( 'includes files under _utils/ (no exclusion — the suffix is the opt-in)', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/_utils/shared.manual.html' );

		const pages = collectManualPages( [ 'packages/*' ], workspaceRoot );

		expect( pages.has( '/packages/ckeditor5-foo/tests/manual/_utils/shared.manual.html' ) ).to.equal( true );
	} );

	test( 'sorts manual pages by slug within the same package', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/zeta.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/alpha.manual.html' )
		] );

		const pages = collectManualPages( [ 'packages/*' ], workspaceRoot );

		expect( [ ...pages.values() ].map( entry => entry.slug ) ).to.deep.equal( [ 'alpha', 'zeta' ] );
	} );

	test( 'accepts the workspace root itself as a package root pattern', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'tests/manual/sample.manual.html' ),
			createFile( workspaceRoot, 'tests/manual/nested/demo-case.manual.html' )
		] );

		const pages = collectManualPages( [ '.' ], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				htmlFilePath: '/tests/manual/nested/demo-case.manual.html',
				packageName: basename( workspaceRoot ),
				slug: 'nested/demo-case'
			},
			{
				htmlFilePath: '/tests/manual/sample.manual.html',
				packageName: basename( workspaceRoot ),
				slug: 'sample'
			}
		] );
	} );

	test( 'accepts package root patterns with a trailing slash', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/sample.manual.html' );

		const pages = collectManualPages( [ 'packages/*/' ], workspaceRoot );

		expect( pages.has( '/packages/ckeditor5-foo/tests/manual/sample.manual.html' ) ).to.equal( true );
	} );
} );
