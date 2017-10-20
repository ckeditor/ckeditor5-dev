/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const utils = require( '../lib/utils.js' );

describe( 'webpack-plugin/utils', () => {
	describe( 'CKEditor5CoreRegExp', () => {
		it( 'should match CKEditor5 core package on Unix systems', () => {
			const path = 'path/to/the/ckeditor5-core/src/file.js';

			const match = path.match( utils.CKEditor5CoreRegExp );

			expect( match ).to.not.be.null;
			expect( match.length ).to.equal( 1 );
			expect( match[ 0 ] ).to.equal( 'path/to/the/ckeditor5-core' );
		} );

		it( 'should match CKEditor5 core package on Windows systems', () => {
			const path = 'C:\\some path\\to\\the\\ckeditor5-core\\src\\file.js';

			const match = path.match( utils.CKEditor5CoreRegExp );

			expect( match ).to.not.be.null;
			expect( match.length ).to.equal( 1 );
			expect( match[ 0 ] ).to.equal( 'C:\\some path\\to\\the\\ckeditor5-core' );
		} );
	} );

	describe( 'CKEditor5PackageNameRegExp', () => {
		it( 'should match CKEditor5 package name on Unix systems', () => {
			const path = 'path/to/the/ckeditor5-enter/src/file.js';

			const match = path.match( utils.CKEditor5PackageNameRegExp );

			expect( match ).to.not.be.null;
			expect( match.length ).to.equal( 1 );
			expect( match[ 0 ] ).to.equal( '/ckeditor5-enter/' );
		} );

		it( 'should match CKEditor5 package name on Windows systems', () => {
			const path = 'C:\\some path\\to\\the\\ckeditor5-enter\\src\\file.js';

			const match = path.match( utils.CKEditor5PackageNameRegExp );

			expect( match ).to.not.be.null;
			expect( match.length ).to.equal( 1 );
			expect( match[ 0 ] ).to.equal( '\\ckeditor5-enter\\' );
		} );
	} );

	describe( 'CKEditor5PackageSrcFileRegExp', () => {
		it( 'should match CKEditor5 package src file on Unix systems', () => {
			const path = 'path/to/the/ckeditor5-enter/src/file.js';

			const match = path.match( utils.CKEditor5PackageSrcFileRegExp );

			expect( match ).to.not.be.null;
			expect( match.length ).to.equal( 1 );
			expect( match[ 0 ] ).to.equal( '/ckeditor5-enter/src/file.js' );
		} );

		it( 'should match CKEditor5 package src file on Windows systems', () => {
			const path = 'C:\\some path\\to\\the\\ckeditor5-enter\\src\\file.js';

			const match = path.match( utils.CKEditor5PackageSrcFileRegExp );

			expect( match ).to.not.be.null;
			expect( match.length ).to.equal( 1 );
			expect( match[ 0 ] ).to.equal( '\\ckeditor5-enter\\src\\file.js' );
		} );
	} );
} );

