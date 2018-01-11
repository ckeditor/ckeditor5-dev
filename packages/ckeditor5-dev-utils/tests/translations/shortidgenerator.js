/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const ShortIdGenerator = require( '../../lib/translations/shortidgenerator' );
const { times } = require( 'lodash' );

describe( 'ShortIdCreator', () => {
	describe( 'getNextId()', () => {
		it( 'should generate id\'s from `a`', () => {
			const shortIdGenerator = new ShortIdGenerator();

			const id = shortIdGenerator.getNextId();

			expect( id ).to.equal( 'a' );
		} );

		it( 'should generate sequential id\'s from `a`', () => {
			const shortIdGenerator = new ShortIdGenerator();

			const firstTenIds = times( 10, () => shortIdGenerator.getNextId() );

			expect( firstTenIds ).to.deep.equal( [
				'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'
			] );
		} );

		it( 'should generate `ab` after `aa` after `z`', () => {
			const shortIdGenerator = new ShortIdGenerator();

			times( 25, () => shortIdGenerator.getNextId() );

			expect( shortIdGenerator.getNextId() ).to.equal( 'z' ); // 26th.
			expect( shortIdGenerator.getNextId() ).to.equal( 'aa' ); // 27th.
			expect( shortIdGenerator.getNextId() ).to.equal( 'ab' ); // 28th.
		} );

		it( 'should generate `ba` after `az`', () => {
			const shortIdGenerator = new ShortIdGenerator();

			times( 51, () => shortIdGenerator.getNextId() );

			expect( shortIdGenerator.getNextId() ).to.equal( 'az' ); // 52th.
			expect( shortIdGenerator.getNextId() ).to.equal( 'ba' ); // 53th.
		} );
	} );
} );
