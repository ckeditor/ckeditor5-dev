/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'findOriginalStrings', () => {
	const sandbox = sinon.sandbox.create();
	let findOriginalStrings, stubs;

	beforeEach( () => {
		stubs = {
			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			},
		};

		findOriginalStrings = proxyquire( '../../lib/translations/findoriginalstrings', {
			'../logger': () => stubs.logger
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should parse the code and find the original strings inside the t function calls', () => {
		const result = findOriginalStrings(
			`function x() {
                t = this.t;
                t( 'Image' );
                t( 'CKEditor' );
                g( 'Some other function' );
                this.t( 'Wrong call' );
            }`
		);

		expect( result ).to.deep.equal( [ 'Image', 'CKEditor' ] );
	} );

	it( 'should log an error when the t call argument is not a string', () => {
		findOriginalStrings(
			`function x() {
                const Image = 'Image';
                t( Image );
            }`
		);

		sinon.assert.calledWithExactly( stubs.logger.error, 'First t() call argument should be a string literal.' );
	} );
} );
