/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const members = require( '../../lib/data/members.json' );
const expect = require( 'chai' ).expect;

describe( 'lib/data/members', () => {
	it( 'should be a function', () => {
		expect( members ).to.be.a( 'object' );
	} );

	// https://github.com/ckeditor/ckeditor5/issues/14876.
	it( 'should not contain GitHub names with spaces', () => {
		const spaceMembers = Object.keys( members ).filter( name => name.includes( ' ' ) );

		expect( spaceMembers ).to.deep.equal( [] );
	} );
} );
