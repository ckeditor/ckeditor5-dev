/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );

describe( 'dev-tests/utils', () => {
	let getRelativeFilePath;

	beforeEach( () => {
		getRelativeFilePath = require( '../../lib/utils/getrelativefilepath' );
	} );

	describe( 'getRelativeFilePath()', () => {
		describe( 'Unix paths', () => {
			it( 'returns path which starts with package name (simple check)', () => {
				checkPath( '/work/space/ckeditor5-foo/tests/manual/foo.js', 'ckeditor5-foo/tests/manual/foo.js' );
			} );

			it( 'returns path which starts with package name (workspace directory looks like package name)', () => {
				checkPath(
					'/Users/foo/ckeditor5-workspace/ckeditor5/packages/ckeditor5-foo/tests/manual/foo.js',
					'ckeditor5-foo/tests/manual/foo.js'
				);
			} );

			it( 'returns path which starts with package name (nested dependencies)', () => {
				checkPath(
					'/home/foo/ckeditor5/packages/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-foo/tests/manual/foo.js',
					'ckeditor5-foo/tests/manual/foo.js'
				);
			} );

			it( 'returns path which starts with package name (combined workspace looks like package and nested dependencies)', () => {
				/* eslint-disable max-len */
				checkPath(
					'/Users/foo/ckeditor5-workspace/ckeditor5/ckeditor5-build-classic/node_modules/@ckeditor/ckeditor5-foo/tests/manual/foo.js',
					'ckeditor5-foo/tests/manual/foo.js'
				);
				/* eslint-enable max-len */
			} );
		} );

		describe( 'Windows paths', () => {
			it( 'returns path which starts with package name (simple check)', () => {
				checkPath( 'C:\\work\\space\\ckeditor5-foo\\tests\\manual\\foo.js', 'ckeditor5-foo\\tests\\manual\\foo.js' );
			} );

			it( 'returns path which starts with package name (workspace directory looks like package name)', () => {
				checkPath(
					'C:\\Document and settings\\foo\\ckeditor5-workspace\\ckeditor5\\packages\\ckeditor5-foo\\tests\\manual\\foo.js',
					'ckeditor5-foo\\tests\\manual\\foo.js'
				);
			} );

			it( 'returns path which starts with package name (nested dependencies)', () => {
				/* eslint-disable max-len */
				checkPath(
					'C:\\Document and settings\\ckeditor5\\packages\\ckeditor5-build-classic\\node_modules\\@ckeditor\\ckeditor5-foo\\tests\\manual\\foo.js',
					'ckeditor5-foo\\tests\\manual\\foo.js'
				);
				/* eslint-enable max-len */
			} );

			it( 'returns path which starts with package name (combined workspace looks like package and nested dependencies)', () => {
				/* eslint-disable max-len */
				checkPath(
					'C:\\Users\\foo\\ckeditor5-workspace\\ckeditor5\\ckeditor5-build-classic\\node_modules\\@ckeditor\\ckeditor5-foo\\tests\\manual\\foo.js',
					'ckeditor5-foo\\tests\\manual\\foo.js'
				);
				/* eslint-enable max-len */
			} );
		} );
	} );

	function checkPath( filePath, expectedPath ) {
		expect( getRelativeFilePath( filePath ) ).to.equal( expectedPath );
	}
} );
