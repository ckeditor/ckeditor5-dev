/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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

		it( 'should execute an async function and return a promise', () => {
			const result = retryAsyncFunction( () => Promise.resolve() );

			expect( result ).to.be.instanceof( Promise );
			return result;
		} );

		it( 'should try to execute an async function 5 times by default', () => {
			const p = sandbox.stub();

			const spy0 = sinon.spy( () => Promise.reject( new Error() ) );
			const spy1 = sinon.spy( () => Promise.reject( new Error() ) );
			const spy2 = sinon.spy( () => Promise.reject( new Error() ) );
			const spy3 = sinon.spy( () => Promise.reject( new Error() ) );
			const spy4 = sinon.spy( () => Promise.resolve( new Error() ) );
			const spy5 = sinon.spy( () => Promise.resolve( new Error() ) );

			// Note: No usage of stub.returns() because of the UnhandledPromiseRejection warnings.

			p.onCall( 0 ).callsFake( spy0 );
			p.onCall( 1 ).callsFake( spy1 );
			p.onCall( 2 ).callsFake( spy2 );
			p.onCall( 3 ).callsFake( spy3 );
			p.onCall( 4 ).callsFake( spy4 );
			p.onCall( 5 ).callsFake( spy5 );

			return retryAsyncFunction( p, { delay: 0 } ).then( () => {
				expect( spy0.calledOnce ).to.be.true;
				expect( spy1.calledOnce ).to.be.true;
				expect( spy2.calledOnce ).to.be.true;
				expect( spy3.calledOnce ).to.be.true;
				expect( spy4.calledOnce ).to.be.true;
				expect( spy5.notCalled ).to.be.true;
			} );
		} );

		it( 'should resolve when one of the calls resolves', () => {
			const p = sandbox.stub();

			// Note: No usage of stub.returns() because of the UnhandledPromiseRejection warnings.
			p.onCall( 0 ).callsFake( () => Promise.reject( new Error() ) );
			p.onCall( 1 ).callsFake( () => Promise.reject( new Error() ) );
			p.onCall( 2 ).callsFake( () => Promise.reject( new Error() ) );
			p.onCall( 3 ).callsFake( () => Promise.reject( new Error() ) );
			p.onCall( 4 ).callsFake( () => Promise.resolve( 5 ) );

			return retryAsyncFunction( p, { delay: 0 } ).then( value => {
				expect( value ).to.equal( 5 );
			} );
		} );

		it( 'should try n times to resolve the function #1', () => {
			const times = 2;
			const p = sandbox.stub();

			p.onFirstCall().rejects();
			p.onSecondCall().resolves( 1 );

			return retryAsyncFunction( p, { delay: 0, times } ).then( value => {
				expect( value ).to.equal( 1 );
			} );
		} );

		it( 'should try n times to resolve the function and return last error #2', done => {
			const times = 2;
			const p = sandbox.stub();
			const error = new Error();

			p.onFirstCall().rejects( new Error() );
			p.onSecondCall().rejects( error );

			retryAsyncFunction( p, { delay: 0, times } ).catch( err => {
				expect( err ).to.equal( error );
				done();
			} );
		} );

		it( 'should resolve at first resolve', () => {
			const n = 2;
			const p = sandbox.stub();

			p.onFirstCall().resolves( 1 );
			p.onSecondCall().resolves( 2 );

			return retryAsyncFunction( p, { delay: 0, times: n } ).then( value => {
				expect( value ).to.equal( 1 );
			} );
		} );

		it( 'should wait specified time after each rejection', () => {
			const delay = 20;
			const p = sandbox.stub();

			p.onFirstCall().callsFake( () => Promise.reject( new Error() ) );
			p.onSecondCall().callsFake( () => Promise.reject( new Error() ) );
			p.onThirdCall().resolves( 7 );

			return retryAsyncFunction( p, { delay } ).then( value => {
				expect( value ).to.equal( 7 );
			} );
		} );
	} );
} );
