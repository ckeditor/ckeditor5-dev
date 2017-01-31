/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'dev-env/release-tools/utils', () => {
	let getOptions;

	describe( 'getOptions()', () => {
		beforeEach( () => {
			getOptions = require( '../../../lib/release-tools/utils/getoptions' );
		} );

		it( 'should return default cwd', () => {
			const options = getOptions();

			expect( options.cwd ).to.be.a( 'string' );
		} );

		it( 'should return default packages', () => {
			const options = getOptions();

			expect( options.packages ).to.equal( 'packages' );
		} );
	} );
} );
