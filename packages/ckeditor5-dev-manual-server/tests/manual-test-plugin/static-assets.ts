/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { getManualStaticAssetFilePath } from '../../src/manual-test-plugin/static-assets.js';

describe( 'getManualStaticAssetFilePath()', () => {
	const workspaceRoot = path.resolve( '/workspace' );

	test( 'returns a workspace file path for a commercial manual test asset', () => {
		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/assets/image.png?v=1',
			workspaceRoot
		) ).to.equal( path.resolve( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/image.png' ) );
	} );

	test( 'returns a workspace file path for an OSS manual test asset', () => {
		expect( getManualStaticAssetFilePath(
			'/external/ckeditor5/packages/ckeditor5-bar/tests/manual/fixtures/data.json',
			workspaceRoot
		) ).to.equal( path.resolve( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-bar/tests/manual/fixtures/data.json' ) );
	} );

	test( 'does not return files processed by the manual server', () => {
		for ( const extension of [ 'html', 'js', 'md', 'ts' ] ) {
			expect( getManualStaticAssetFilePath(
				`/packages/ckeditor5-foo/tests/manual/test.${ extension }`,
				workspaceRoot
			) ).to.be.null;
		}
	} );

	test( 'does not handle Vite module requests', () => {
		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/assets/image.png?import',
			workspaceRoot
		) ).to.be.null;
	} );

	test( 'does not return assets outside supported manual test directories', () => {
		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/automated/assets/image.png',
			workspaceRoot
		) ).to.be.null;

		expect( getManualStaticAssetFilePath(
			'/external/other-repository/packages/ckeditor5-bar/tests/manual/fixtures/data.json',
			workspaceRoot
		) ).to.be.null;
	} );

	test( 'does not return paths with traversal segments', () => {
		for ( const requestPath of [
			'/packages/ckeditor5-foo/tests/manual/../secret.png',
			'/packages/ckeditor5-foo/tests/manual/%2e%2e/secret.png',
			'/packages/ckeditor5-foo/tests/manual/..%5csecret.png'
		] ) {
			expect( getManualStaticAssetFilePath( requestPath, workspaceRoot ) ).to.be.null;
		}
	} );
} );
