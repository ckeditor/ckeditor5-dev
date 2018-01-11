/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'bundler', () => {
	let tasks;

	beforeEach( () => {
		tasks = require( '../../lib/bundler/index' );
	} );

	describe( 'createEntryFile()', () => {
		it( 'should be a function', () => {
			expect( tasks.createEntryFile ).to.be.a( 'function' );
		} );
	} );

	describe( 'getLicenseBanner()', () => {
		it( 'should be a function', () => {
			expect( tasks.getLicenseBanner ).to.be.a( 'function' );
		} );
	} );
} );
