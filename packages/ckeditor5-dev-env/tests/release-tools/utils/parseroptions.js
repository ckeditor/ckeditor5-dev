/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;

describe( 'dev-env/release-tools/utils', () => {
	let parserOptions;

	beforeEach( () => {
		parserOptions = require( '../../../lib/release-tools/utils/parseroptions' );
	} );

	describe( 'parser-options', () => {
		it( 'should not hoist closed tickets', () => {
			expect( parserOptions.referenceActions ).to.deep.equal( [] );
		} );
	} );
} );
