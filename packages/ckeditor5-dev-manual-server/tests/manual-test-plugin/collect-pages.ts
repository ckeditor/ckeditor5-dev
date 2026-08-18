/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { basename } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

	it( 'collects sorted manual page entries from package root globs', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-zeta/manual/nested/demo-case.manual.html' ),
			createFile( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-alpha/manual/sample.manual.html' )
		] );

		const pages = collectManualPages( [
			'packages/*',
			'external/ckeditor5/packages/*'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				htmlFilePath: '/external/ckeditor5/packages/ckeditor5-alpha/manual/sample.manual.html',
				packageName: 'ckeditor5-alpha',
				slug: 'sample'
			},
			{
				htmlFilePath: '/packages/ckeditor5-zeta/manual/nested/demo-case.manual.html',
				packageName: 'ckeditor5-zeta',
				slug: 'nested/demo-case'
			}
		] );
	} );

	it( 'ignores plain .html fixtures and files outside manual', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/_utils/helper.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/fixture.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/script-only.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/other/sample.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/legacy-location.manual.html' )
		] );

		expect( collectManualPages( [ 'packages/*' ], workspaceRoot ) ).to.deep.equal( new Map() );
	} );

	it( 'collects manual pages from any package tree location matched by the patterns', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'custom/tree/ckeditor5-custom/manual/sample.manual.html' ),
			createFile( workspaceRoot, 'ckeditor5-top-level/manual/sample.manual.html' )
		] );

		const pages = collectManualPages( [
			'custom/tree/*',
			'ckeditor5-top-level'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				htmlFilePath: '/custom/tree/ckeditor5-custom/manual/sample.manual.html',
				packageName: 'ckeditor5-custom',
				slug: 'sample'
			},
			{
				htmlFilePath: '/ckeditor5-top-level/manual/sample.manual.html',
				packageName: 'ckeditor5-top-level',
				slug: 'sample'
			}
		] );
	} );

	it( 'includes files under _utils/ (no exclusion — the suffix is the opt-in)', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/_utils/shared.manual.html' );

		const pages = collectManualPages( [ 'packages/*' ], workspaceRoot );

		expect( pages.has( '/packages/ckeditor5-foo/manual/_utils/shared.manual.html' ) ).to.equal( true );
	} );

	it( 'sorts manual pages by slug within the same package', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/zeta.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/alpha.manual.html' )
		] );

		const pages = collectManualPages( [ 'packages/*' ], workspaceRoot );

		expect( [ ...pages.values() ].map( entry => entry.slug ) ).to.deep.equal( [ 'alpha', 'zeta' ] );
	} );

	it( 'accepts the workspace root itself as a package root pattern', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'manual/sample.manual.html' ),
			createFile( workspaceRoot, 'manual/nested/demo-case.manual.html' )
		] );

		const pages = collectManualPages( [ '.' ], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				htmlFilePath: '/manual/nested/demo-case.manual.html',
				packageName: basename( workspaceRoot ),
				slug: 'nested/demo-case'
			},
			{
				htmlFilePath: '/manual/sample.manual.html',
				packageName: basename( workspaceRoot ),
				slug: 'sample'
			}
		] );
	} );

	it( 'accepts package root patterns with a trailing slash', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/sample.manual.html' );

		const pages = collectManualPages( [ 'packages/*/' ], workspaceRoot );

		expect( pages.has( '/packages/ckeditor5-foo/manual/sample.manual.html' ) ).to.equal( true );
	} );
} );
