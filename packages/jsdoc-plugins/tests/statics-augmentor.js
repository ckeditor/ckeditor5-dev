/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const augmentStatics = require( '../lib/statics-augmentor/augmentstatics' );

describe( 'Static members inheritance plugin', () => {
	it( 'should add doclet of implicitly inherited static member', () => {
		const inputDoclets = require( './statics-augmentor-mockups/implicit' ).inputDoclets;
		const expectedResult = require( './statics-augmentor-mockups/implicit' ).expectedResult;
		const doclets = clone( inputDoclets );
		augmentStatics( doclets );

		expect( doclets ).to.eql( expectedResult );
	} );

	it( 'should add doclet of static member inherited using @inheritdoc', () => {
		const inputDoclets = require( './statics-augmentor-mockups/inheritdoc' ).inputDoclets;
		const expectedResult = require( './statics-augmentor-mockups/inheritdoc' ).expectedResult;
		const doclets = clone( inputDoclets );
		augmentStatics( doclets );

		expect( doclets ).to.eql( expectedResult );
	} );

	it( 'should modify a doclet of inherited static member which had its own docs', () => {
		const inputDoclets = require( './statics-augmentor-mockups/explicit' ).inputDoclets;
		const expectedResult = require( './statics-augmentor-mockups/explicit' ).expectedResult;
		const doclets = clone( inputDoclets );
		augmentStatics( doclets );

		expect( doclets ).to.eql( expectedResult );
	} );
} );

function clone( obj ) {
	return JSON.parse( JSON.stringify( obj ) );
}
