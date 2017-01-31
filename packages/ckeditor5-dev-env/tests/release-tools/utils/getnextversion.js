/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'dev-env/release-tools/utils', () => {
	let getNextVersion;

	describe( 'getNextVersion()', () => {
		beforeEach( () => {
			getNextVersion = require( '../../../lib/release-tools/utils/getnextversion' );
		} );

		it( 'bumps the major', () => {
			expect( getNextVersion( '0.2.3', 'major' ) ).to.equal( '1.0.0' );
		} );

		it( 'bumps the minor', () => {
			expect( getNextVersion( '1.0.10', 'minor' ) ).to.equal( '1.1.0' );
		} );

		it( 'bumps the patch', () => {
			expect( getNextVersion( '3.2.0', 'patch' ) ).to.equal( '3.2.1' );
		} );

		it( 'bumps the version starting with "v"', () => {
			expect( getNextVersion( 'v1.0.0', 'patch' ) ).to.equal( '1.0.1' );
		} );
	} );
} );
