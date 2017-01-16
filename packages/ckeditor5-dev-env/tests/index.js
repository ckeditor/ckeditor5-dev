/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'index', () => {
	let tasks;

	beforeEach( () => {
		tasks = require( '../lib/index' )( {
			workspaceDir: '..'
		} );
	} );

	describe( 'generateChangeLog', () => {
		it( 'should be defined', () => {
			expect( tasks.generateChangeLog ).to.be.a( 'function' );
		} );
	} );

	describe( 'createRelease', () => {
		it( 'should be defined', () => {
			expect( tasks.createRelease ).to.be.a( 'function' );
		} );
	} );
} );
