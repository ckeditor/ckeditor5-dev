/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;

describe( 'builds', () => {
	let tasks;

	beforeEach( () => {
		tasks = require( '../../lib/builds/index' );
	} );

	describe( 'getDllPluginWebpackConfig()', () => {
		it( 'should be a function', () => {
			expect( tasks.getDllPluginWebpackConfig ).to.be.a( 'function' );
		} );
	} );
} );
