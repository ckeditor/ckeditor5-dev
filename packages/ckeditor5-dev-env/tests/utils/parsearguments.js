/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'utils', () => {
	let parseArguments;

	describe( 'changelog', () => {
		beforeEach( () => {
			parseArguments = require( '../../lib/utils/parsearguments' );
		} );

		it( 'should return default options', () => {
			const options = parseArguments( [] );

			expect( options.init ).to.equal( false );
		} );
	} );
} );
