/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const proxyquire = require( 'proxyquire' );

describe( 'translations', () => {
	describe( 'retryAsyncFunction()', () => {
		let sandbox, stubs, retryAsyncFunction;
		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				logger: {
					info: sandbox.stub(),
					warning: sandbox.stub(),
					error: sandbox.stub()
				}
			};

			retryAsyncFunction = proxyquire( '../../lib/translations/retryasyncfunction', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger: () => stubs.logger
				}
			} );
		} );

		afterEach( () => {
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should exeute an async function and return a promise', () => {
			const result = retryAsyncFunction( () => Promise.resolve() );

			expect( result ).to.be.instanceof( Promise );
			return result;
		} );

		it( 'should try to exeute an async function 5 times by default', () => {
			const p = sandbox.stub();

			p.onFirstCall().returns( Promise.reject() );
			p.onSecondCall().returns( Promise.resolve() );

			return retryAsyncFunction( p, { delay: 0 } );
		} );

		it( 'should resolve when one of the calls resolves', () => {
			const p = sandbox.stub();

			p.onFirstCall().returns( Promise.reject() );
			p.onSecondCall().returns( Promise.resolve() );

			return retryAsyncFunction( p, { delay: 0 } );
		} );

		it( 'should exeute an async function and return a promise 1', () => {
			const p = sandbox.stub();

			p.onFirstCall().returns( Promise.reject() );
			p.onSecondCall().returns( Promise.resolve() );

			return retryAsyncFunction( p, { delay: 0, times: 2 } );
		} );
	} );
} );
