/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'dev-release-tools/utils', () => {
	let parserOptions;

	beforeEach( () => {
		parserOptions = require( '../../lib/utils/parseroptions' );
	} );

	describe( 'parser-options', () => {
		it( 'should not hoist closed tickets', () => {
			expect( parserOptions.referenceActions ).to.deep.equal( [] );
		} );
	} );
} );
