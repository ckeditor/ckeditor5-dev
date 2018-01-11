/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'styles', () => {
	let tasks;

	beforeEach( () => {
		tasks = require( '../../lib/styles/index' );
	} );

	describe( 'getPostCssConfig()', () => {
		it( 'should be a function', () => {
			expect( tasks.getPostCssConfig ).to.be.a( 'function' );
		} );
	} );

	describe( 'themeImporter()', () => {
		it( 'should be a function', () => {
			expect( tasks.themeImporter ).to.be.a( 'function' );
		} );
	} );

	describe( 'themeLogger()', () => {
		it( 'should be a function', () => {
			expect( tasks.themeLogger ).to.be.a( 'function' );
		} );
	} );
} );
