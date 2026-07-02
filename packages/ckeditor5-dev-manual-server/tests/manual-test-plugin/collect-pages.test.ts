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
			createFile( workspaceRoot, 'packages/ckeditor5-zeta/tests/manual/nested/demo-case.manual.html' ),
			createFile( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.manual.html' )
		] );

		const pages = collectManualPages( [
			'packages/*/tests/manual/**/*',
			'external/ckeditor5/packages/*/tests/manual/**/*'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				displayName: 'Sample',
				htmlFilePath: '/external/ckeditor5/packages/ckeditor5-alpha/tests/manual/sample.manual.html',
				packageName: 'ckeditor5-alpha',
				slug: 'sample'
			},
			{
				displayName: 'Nested / Demo Case',
				htmlFilePath: '/packages/ckeditor5-zeta/tests/manual/nested/demo-case.manual.html',
				packageName: 'ckeditor5-zeta',
				slug: 'nested/demo-case'
			}
		] );
	} );

	test( 'reads the display name from the <title> when present', async () => {
		await createFile(
			workspaceRoot,
			'packages/ckeditor5-foo/tests/manual/sample.manual.html',
			'<!DOCTYPE html><html><head><title>Custom Title</title></head><body></body></html>'
		);

		const pages = collectManualPages( [ 'packages/*/tests/manual/**/*' ], workspaceRoot );

		expect( pages.get( '/packages/ckeditor5-foo/tests/manual/sample.manual.html' )!.displayName )
			.to.equal( 'Custom Title' );
	} );

	test( 'ignores plain .html fixtures and non-manual files', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/_utils/helper.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/fixture.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/script-only.js' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/other/sample.manual.html' )
		] );

		expect( collectManualPages( [ 'packages/**/*' ], workspaceRoot ) ).to.deep.equal( new Map() );
	} );

	test( 'collects manual pages from any package tree location matched by the patterns', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'custom/tree/ckeditor5-custom/tests/manual/sample.manual.html' ),
			createFile( workspaceRoot, 'ckeditor5-top-level/tests/manual/sample.manual.html' )
		] );

		const pages = collectManualPages( [
			'custom/tree/*/tests/manual/**/*',
			'ckeditor5-top-level/tests/manual/**/*'
		], workspaceRoot );

		expect( [ ...pages.values() ] ).to.deep.equal( [
			{
				displayName: 'Sample',
				htmlFilePath: '/custom/tree/ckeditor5-custom/tests/manual/sample.manual.html',
				packageName: 'ckeditor5-custom',
				slug: 'sample'
			},
			{
				displayName: 'Sample',
				htmlFilePath: '/ckeditor5-top-level/tests/manual/sample.manual.html',
				packageName: 'ckeditor5-top-level',
				slug: 'sample'
			}
		] );
	} );

	test( 'includes files under _utils/ (no exclusion — the suffix is the opt-in)', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/_utils/shared.manual.html' );

		const pages = collectManualPages( [ 'packages/*/tests/manual/**/*' ], workspaceRoot );

		expect( pages.has( '/packages/ckeditor5-foo/tests/manual/_utils/shared.manual.html' ) ).to.equal( true );
	} );

	test( 'sorts manual pages by slug within the same package', async () => {
		await Promise.all( [
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/zeta.manual.html' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/alpha.manual.html' )
		] );

		const pages = collectManualPages( [ 'packages/*/tests/manual/**/*' ], workspaceRoot );

		expect( [ ...pages.values() ].map( entry => entry.slug ) ).to.deep.equal( [ 'alpha', 'zeta' ] );
	} );
} );
