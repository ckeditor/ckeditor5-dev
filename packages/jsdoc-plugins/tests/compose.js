/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/* jshint mocha:true */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const composeFunctions = require( '../lib/utils/compose-functions' );

describe( 'composeFunctions', () => {
	it( 'should compose functions', () => {
		const addTwo = x => x + 2;
		const multiplyByTwo = x => x * 2;

		expect(
			composeFunctions(
				addTwo,
				multiplyByTwo
			)( 2 )
		).to.be.equal( 8 ); // Note that this is not 6!
	} );
} );
