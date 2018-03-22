/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );

describe( 'dev-tests/utils', () => {
	let getPackageName;

	beforeEach( () => {
		getPackageName = require( '../../../lib/styles/utils/getpackagename' );
	} );

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
					'/home/foo/ckeditor5/packages/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-foo/tests/manual/foo.js',
					'ckeditor5-foo'
				);
			} );

			/* eslint-disable max-len */
			it( 'returns package name for path which starts with package name (combined workspace looks like package and nested dependencies)', () => {
				checkPackage(
					'/Users/foo/ckeditor5-workspace/ckeditor5/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-foo/tests/manual/foo.js',
					'ckeditor5-foo'
				);
			} );
			/* eslint-enable max-len */
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
				/* eslint-disable max-len */
				checkPackage(
					'C:\\Document and settings\\ckeditor5\\packages\\ckeditor5-build-classic\\node_modules\\@ckeditor\\ckeditor5-foo\\tests\\manual\\foo.js',
					'ckeditor5-foo'
				);
				/* eslint-enable max-len */
			} );

			/* eslint-disable max-len */
			it( 'returns package name for path which starts with package name (combined workspace looks like package and nested dependencies)', () => {
				checkPackage(
					'C:\\Users\\foo\\ckeditor5-workspace\\ckeditor5\\ckeditor5-build-classic\\node_modules\\@ckeditor\\ckeditor5-foo\\tests\\manual\\foo.js',
					'ckeditor5-foo'
				);
			} );
			/* eslint-enable max-len */
		} );
	} );

	function checkPackage( filePath, expectedPath ) {
		expect( getPackageName( filePath ) ).to.equal( expectedPath );
	}
} );
