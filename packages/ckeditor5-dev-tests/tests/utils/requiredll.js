/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'dev-tests/utils', () => {
	let requireDll;

	beforeEach( () => {
		requireDll = require( '../../lib/utils/requiredll' );
	} );

	describe( 'requireDll()', () => {
		let sandbox;

		beforeEach( () => {
			sandbox = sinon.createSandbox();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should return true when loads JavaScript DLL file (Unix)', () => {
			const files = [
				'/workspace/ckeditor5/tests/manual/all-features-dll.js'
			];

			expect( requireDll( files ) ).to.equal( true );
		} );

		it( 'should return true when loads TypeScript DLL file (Unix)', () => {
			const files = [
				'/workspace/ckeditor5/tests/manual/all-features-dll.ts'
			];

			expect( requireDll( files ) ).to.equal( true );
		} );

		it( 'should return true when loads JavaScript DLL file (Windows)', () => {
			const files = [
				'C:\\workspace\\ckeditor5\\tests\\manual\\all-features-dll.js'
			];

			expect( requireDll( files ) ).to.equal( true );
		} );

		it( 'should return true when loads TypeScript DLL file (Windows)', () => {
			const files = [
				'C:\\workspace\\ckeditor5\\tests\\manual\\all-features-dll.ts'
			];

			expect( requireDll( files ) ).to.equal( true );
		} );

		it( 'should return false when loads JavaScript non-DLL file (Unix)', () => {
			const files = [
				'/workspace/ckeditor5/tests/manual/article.js'
			];

			expect( requireDll( files ) ).to.equal( false );
		} );

		it( 'should return false when loads TypeScript non-DLL file (Unix)', () => {
			const files = [
				'/workspace/ckeditor5/tests/manual/article.ts'
			];

			expect( requireDll( files ) ).to.equal( false );
		} );

		it( 'should return false when loads JavaScript non-DLL file (Windows)', () => {
			const files = [
				'C:\\workspace\\ckeditor5\\tests\\manual\\article.js'
			];

			expect( requireDll( files ) ).to.equal( false );
		} );

		it( 'should return false when loads TypeScript non-DLL file (Windows)', () => {
			const files = [
				'C:\\workspace\\ckeditor5\\tests\\manual\\article.ts'
			];

			expect( requireDll( files ) ).to.equal( false );
		} );
	} );
} );
