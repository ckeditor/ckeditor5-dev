/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getPackageName from '../../../src/styles/utils/getpackagename.js';

describe( 'getPackageName()', () => {
	describe( 'Unix paths', () => {
		it( 'returns package name for path which starts with package name (simple check)', () => {
			checkPackage( '/work/space/ckeditor5-foo/tests/manual/foo.js', 'ckeditor5-foo' );
		} );

		it( 'returns package name for path which starts with package name (workspace directory looks like package name)', () => {
			checkPackage(
				'/Users/foo/ckeditor5-workspace/ckeditor5/packages/ckeditor5-foo/tests/manual/foo.js',
				'ckeditor5-foo'
			);
		} );

		it( 'returns package name for path which starts with package name (nested dependencies)', () => {
			checkPackage(
				'/home/foo/ckeditor5/packages/ckeditor5-editor-classic/node_modules/@ckeditor/ckeditor5-foo/tests/manual/foo.js',
				'ckeditor5-foo'
			);
		} );

		/* eslint-disable @stylistic/max-len */
		it( 'returns package name for path which starts with package name (combined workspace looks like package and nested dependencies)', () => {
			checkPackage(
				'/Users/foo/ckeditor5-workspace/ckeditor5/ckeditor5-editor-classic/node_modules/@ckeditor/ckeditor5-foo/tests/manual/foo.js',
				'ckeditor5-foo'
			);
		} );
		/* eslint-enable @stylistic/max-len */
	} );

	describe( 'Windows paths', () => {
		it( 'returns package name for path which starts with package name (simple check)', () => {
			checkPackage( 'C:\\work\\space\\ckeditor5-foo\\tests\\manual\\foo.js', 'ckeditor5-foo' );
		} );

		it( 'returns package name for path which starts with package name (workspace directory looks like package name)', () => {
			checkPackage(
				'C:\\Document and settings\\foo\\ckeditor5-workspace\\ckeditor5\\packages\\ckeditor5-foo\\tests\\manual\\foo.js',
				'ckeditor5-foo'
			);
		} );

		it( 'returns package name for path which starts with package name (nested dependencies)', () => {
			/* eslint-disable @stylistic/max-len */
			checkPackage(
				'C:\\Document and settings\\ckeditor5\\packages\\ckeditor5-editor-classic\\node_modules\\@ckeditor\\ckeditor5-foo\\tests\\manual\\foo.js',
				'ckeditor5-foo'
			);
			/* eslint-enable @stylistic/max-len */
		} );

		/* eslint-disable @stylistic/max-len */
		it( 'returns package name for path which starts with package name (combined workspace looks like package and nested dependencies)', () => {
			checkPackage(
				'C:\\Users\\foo\\ckeditor5-workspace\\ckeditor5\\ckeditor5-editor-classic\\node_modules\\@ckeditor\\ckeditor5-foo\\tests\\manual\\foo.js',
				'ckeditor5-foo'
			);
		} );
		/* eslint-enable @stylistic/max-len */
	} );
} );

function checkPackage( filePath: string, expectedPath: string ) {
	expect( getPackageName( filePath ) ).to.equal( expectedPath );
}
