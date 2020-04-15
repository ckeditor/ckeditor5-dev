/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'findMessages', () => {
	const sandbox = sinon.createSandbox();
	let findMessages, stubs;

	beforeEach( () => {
		stubs = {
			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			}
		};

		findMessages = proxyquire( '../../lib/translations/findmessages', {
			'../logger': () => stubs.logger
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should parse the code and find the original strings inside the t function calls', () => {
		const result = findMessages(
			`function x() {
                t = this.t;
                t( 'Image' );
                t( 'CKEditor' );
                g( 'Some other function' );
                this.t( 'Wrong call' );
            }`
		);

		expect( result ).to.deep.equal( [ { id: 'Image', string: 'Image' }, { id: 'CKEditor', string: 'CKEditor' } ] );
	} );

	// TODO - test various t() calls

	it( 'should log an error when the t call argument is not a string', () => {
		findMessages(
			`function x() {
                const Image = 'Image';
                t( Image );
            }`
		);

		sinon.assert.calledWithExactly( stubs.logger.error, 'First t() call argument should be a string literal.' );
	} );
} );
