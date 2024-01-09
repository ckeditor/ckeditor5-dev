/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'dev-release-tools/utils', () => {
	describe( 'abortController()', () => {
		let abortController, listeners, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			listeners = {};

			stubs = {
				process: {
					prependOnceListener: sandbox.stub().callsFake( ( eventName, listener ) => {
						listeners[ eventName ] = new Set( [
							listener,
							...listeners[ eventName ] || []
						] );
					} ),
					removeListener: sandbox.stub().callsFake( ( eventName, listener ) => {
						if ( listeners[ eventName ] ) {
							listeners[ eventName ].delete( listener );
						}
					} )
				}
			};

			sandbox.stub( process, 'prependOnceListener' ).callsFake( stubs.process.prependOnceListener );
			sandbox.stub( process, 'removeListener' ).callsFake( stubs.process.removeListener );

			abortController = require( '../../lib/utils/abortcontroller' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should return AbortController instance', () => {
			const abortControllerInstance = abortController.registerAbortController();

			expect( abortControllerInstance ).to.be.instanceof( global.AbortController );
		} );

		it( 'should store listener in internal property for further use', () => {
			const abortControllerInstance = abortController.registerAbortController();

			expect( abortControllerInstance._listener ).to.be.a( 'function' );
		} );

		it( 'should register listener on SIGINT event', () => {
			const abortControllerInstance = abortController.registerAbortController();

			expect( stubs.process.prependOnceListener.callCount ).to.equal( 1 );
			expect( stubs.process.prependOnceListener.firstCall.args[ 0 ] ).to.equal( 'SIGINT' );
			expect( stubs.process.prependOnceListener.firstCall.args[ 1 ] ).to.equal( abortControllerInstance._listener );
		} );

		it( 'should call abort method on SIGINT event', () => {
			const abortControllerInstance = abortController.registerAbortController();

			sandbox.spy( abortControllerInstance, 'abort' );

			listeners.SIGINT.forEach( listener => listener() );

			expect( abortControllerInstance.abort.callCount ).to.equal( 1 );
			expect( abortControllerInstance.abort.firstCall.args[ 0 ] ).to.equal( 'SIGINT' );
		} );

		it( 'should not deregister listener if AbortController instance is not set', () => {
			abortController.deregisterAbortController();

			expect( stubs.process.removeListener.callCount ).to.equal( 0 );
		} );

		it( 'should not deregister listener if AbortController instance is not registered', () => {
			const abortControllerInstance = new AbortController();

			abortController.deregisterAbortController( abortControllerInstance );

			expect( stubs.process.removeListener.callCount ).to.equal( 0 );
		} );

		it( 'should deregister listener if AbortController instance is registered', () => {
			const abortControllerInstance = abortController.registerAbortController();

			abortController.deregisterAbortController( abortControllerInstance );

			expect( stubs.process.removeListener.callCount ).to.equal( 1 );
			expect( stubs.process.removeListener.firstCall.args[ 0 ] ).to.equal( 'SIGINT' );
			expect( stubs.process.removeListener.firstCall.args[ 1 ] ).to.equal( abortControllerInstance._listener );
		} );
	} );
} );
