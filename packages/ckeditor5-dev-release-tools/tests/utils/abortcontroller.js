/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'dev-release-tools/utils', () => {
	describe( 'abortController()', () => {
		let abortController, processCallbacks, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			processCallbacks = {};

			stubs = {
				process: {
					on: sandbox.stub().callsFake( ( eventName, callback ) => {
						if ( !processCallbacks[ eventName ] ) {
							processCallbacks[ eventName ] = new Set();
						}

						processCallbacks[ eventName ].add( callback );
					} ),
					off: sandbox.stub().callsFake( ( eventName, callback ) => {
						if ( processCallbacks[ eventName ] ) {
							processCallbacks[ eventName ].delete( callback );
						}
					} )
				}
			};

			sandbox.stub( process, 'on' ).callsFake( stubs.process.on );
			sandbox.stub( process, 'off' ).callsFake( stubs.process.off );

			abortController = require( '../../lib/utils/abortcontroller' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should return AbortController instance', () => {
			const abortControllerInstance = abortController.registerAbortController();

			expect( abortControllerInstance ).to.be.instanceof( global.AbortController );
		} );

		it( 'should store callback in internal property for further use', () => {
			const abortControllerInstance = abortController.registerAbortController();

			expect( abortControllerInstance._callback ).to.be.a( 'function' );
		} );

		it( 'should register callback on SIGINT event', () => {
			const abortControllerInstance = abortController.registerAbortController();

			expect( stubs.process.on.callCount ).to.equal( 1 );
			expect( stubs.process.on.firstCall.args[ 0 ] ).to.equal( 'SIGINT' );
			expect( stubs.process.on.firstCall.args[ 1 ] ).to.equal( abortControllerInstance._callback );
		} );

		it( 'should call abort method on SIGINT event', () => {
			const abortControllerInstance = abortController.registerAbortController();

			sandbox.spy( abortControllerInstance, 'abort' );

			processCallbacks.SIGINT.forEach( callback => callback() );

			expect( abortControllerInstance.abort.callCount ).to.equal( 1 );
			expect( abortControllerInstance.abort.firstCall.args[ 0 ] ).to.equal( 'SIGINT' );
		} );

		it( 'should not deregister callback if AbortController instance is not set', () => {
			abortController.deregisterAbortController();

			expect( stubs.process.off.callCount ).to.equal( 0 );
		} );

		it( 'should not deregister callback if AbortController instance is not registered', () => {
			const abortControllerInstance = new AbortController();

			abortController.deregisterAbortController( abortControllerInstance );

			expect( stubs.process.off.callCount ).to.equal( 0 );
		} );

		it( 'should deregister callback if AbortController instance is registered', () => {
			const abortControllerInstance = abortController.registerAbortController();

			abortController.deregisterAbortController( abortControllerInstance );

			expect( stubs.process.off.callCount ).to.equal( 1 );
			expect( stubs.process.off.firstCall.args[ 0 ] ).to.equal( 'SIGINT' );
			expect( stubs.process.off.firstCall.args[ 1 ] ).to.equal( abortControllerInstance._callback );
		} );
	} );
} );
