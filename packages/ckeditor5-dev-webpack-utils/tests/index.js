/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'dev-webpack-utils/index', () => {
	let utils;

	beforeEach( () => {
		utils = require( '../lib/index' );
	} );

	describe( 'getWebpackConfig()', () => {
		it( 'is defined', () => {
			expect( utils.getWebpackConfig ).to.be.a( 'function' );
		} );
	} );

	describe( 'getWebpackCompatConfig()', () => {
		it( 'is defined', () => {
			expect( utils.getWebpackCompatConfig ).to.be.a( 'function' );
		} );
	} );
} );
