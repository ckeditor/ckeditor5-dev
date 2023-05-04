/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'dev-release-tools/utils', () => {
	describe( 'normalizePath()', () => {
		let normalizePath;

		beforeEach( () => {
			normalizePath = require( '../../lib/utils/normalizepath' );
		} );

		it( 'should remove leading and trailing slashes', () => {
			expect( normalizePath( '/path' ) ).to.equal( 'path' );
			expect( normalizePath( 'path/' ) ).to.equal( 'path' );
			expect( normalizePath( '/path/to/packages' ) ).to.equal( 'path/to/packages' );
			expect( normalizePath( 'path/to/packages/' ) ).to.equal( 'path/to/packages' );
			expect( normalizePath( '/path/to/packages/' ) ).to.equal( 'path/to/packages' );
		} );

		it( 'should remove leading and trailing backslashes and convert them to slashes', () => {
			expect( normalizePath( '\\path' ) ).to.equal( 'path' );
			expect( normalizePath( 'path\\' ) ).to.equal( 'path' );
			expect( normalizePath( '\\path\\to\\packages' ) ).to.equal( 'path/to/packages' );
			expect( normalizePath( 'path\\to\\packages\\' ) ).to.equal( 'path/to/packages' );
			expect( normalizePath( '\\path\\to\\packages\\' ) ).to.equal( 'path/to/packages' );
		} );
	} );
} );
