/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
	collectManualStaticAssets,
	getManualStaticAssetFilePath
} from '../../src/manual-test-plugin/static-assets.js';

describe( 'manual static assets', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await mkdtemp( join( tmpdir(), 'ckeditor5-manual-static-assets-' ) );
	} );

	afterEach( async () => {
		await rm( workspaceRoot, { recursive: true, force: true } );
	} );

	test( 'collects manual test assets from configured patterns', async () => {
		await Promise.all( [
			createFile( 'packages/ckeditor5-foo/tests/manual/assets/image.png' ),
			createFile( 'external/ckeditor5/packages/ckeditor5-bar/tests/manual/sample.jpg' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/test.html' ),
			createFile( 'packages/ckeditor5-foo/tests/manual/test.js' )
		] );

		const staticAssets = collectManualStaticAssets( [
			'packages/*/tests/manual/**/*',
			'external/ckeditor5/packages/*/tests/manual/**/*'
		], workspaceRoot );

		expect( [ ...staticAssets.entries() ] ).to.deep.equal( [
			[
				'/external/ckeditor5/packages/ckeditor5-bar/tests/manual/sample.jpg',
				join( workspaceRoot, 'external/ckeditor5/packages/ckeditor5-bar/tests/manual/sample.jpg' )
			],
			[
				'/packages/ckeditor5-foo/tests/manual/assets/image.png',
				join( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/assets/image.png' )
			]
		] );
	} );

	test( 'returns the collected file path for a request URL', () => {
		const staticAssets = new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.png', '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' ]
		] );

		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/assets/image.png?v=1',
			staticAssets
		) ).to.equal( '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' );
	} );

	test( 'does not handle Vite module requests', () => {
		const staticAssets = new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.png', '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' ]
		] );

		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/assets/image.png?url',
			staticAssets
		) ).to.be.null;
	} );

	test( 'ignores unknown and invalid request URLs', () => {
		const staticAssets = new Map( [
			[ '/packages/ckeditor5-foo/tests/manual/assets/image.png', '/workspace/packages/ckeditor5-foo/tests/manual/assets/image.png' ]
		] );

		expect( getManualStaticAssetFilePath(
			'/packages/ckeditor5-foo/tests/manual/missing.png',
			staticAssets
		) ).to.be.null;
		expect( getManualStaticAssetFilePath( 'http://%', staticAssets ) ).to.be.null;
		expect( getManualStaticAssetFilePath( undefined, staticAssets ) ).to.be.null;
	} );

	async function createFile( relativeFilePath: string ): Promise<void> {
		const filePath = join( workspaceRoot, relativeFilePath );

		await mkdir( dirname( filePath ), { recursive: true } );
		await writeFile( filePath, '' );
	}
} );
