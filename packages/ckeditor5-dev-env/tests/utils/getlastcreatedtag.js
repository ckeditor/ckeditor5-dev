/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'utils', () => {
	let getLastCreatedTag, shExecStub;

	describe( 'getLastCreatedTag', () => {
		beforeEach( () => {
			getLastCreatedTag = require( '../../lib/utils/getlastcreatedtag' );

			shExecStub = sinon.stub( tools, 'shExec' );
		} );

		afterEach( () => {
			shExecStub.restore();
		} );

		it( 'returns null when any tag does not exist', () => {
			shExecStub.onFirstCall().returns( '' );

			expect( getLastCreatedTag() ).to.equal( null );
		} );

		it( 'returns last tag when at least one tag is available', () => {
			shExecStub.onFirstCall().returns( [
				'v0.0.2',
				'v0.0.3',
				'v0.0.4',
			].join( '\n' ) );

			shExecStub.onSecondCall().returns( 'v0.0.4' );

			expect( getLastCreatedTag() ).to.equal( 'v0.0.4' );
		} );
	} );
} );
