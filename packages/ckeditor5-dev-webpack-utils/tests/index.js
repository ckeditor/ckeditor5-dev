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

	describe( 'CKEditorWebpackPlugin()', () => {
		it( 'is defined', () => {
			expect( utils.CKEditorWebpackPlugin ).to.be.a( 'function' );
		} );
	} );

	describe( 'getWebpackConfig()', () => {
		it( 'is defined', () => {
			expect( utils.getWebpackConfig ).to.be.a( 'function' );
		} );
	} );

	describe( 'getWebpackCompactConfig()', () => {
		it( 'is defined', () => {
			expect( utils.getWebpackCompactConfig ).to.be.a( 'function' );
		} );
	} );
} );
