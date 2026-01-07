/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import requireDll from '../../lib/utils/requiredll.js';

describe( 'requireDll()', () => {
	it( 'should return true when loads JavaScript DLL file (Unix)', () => {
		const files = [
			'/workspace/ckeditor5/tests/manual/all-features-dll.js'
		];

		expect( requireDll( files ) ).to.equal( true );
	} );

	it( 'should return true when loads single JavaScript DLL file (Unix)', () => {
		const file = '/workspace/ckeditor5/tests/manual/all-features-dll.js';

		expect( requireDll( file ) ).to.equal( true );
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

	it( 'should return false when loads single JavaScript non-DLL file (Unix)', () => {
		const file = '/workspace/ckeditor5/tests/manual/article.js';

		expect( requireDll( file ) ).to.equal( false );
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
