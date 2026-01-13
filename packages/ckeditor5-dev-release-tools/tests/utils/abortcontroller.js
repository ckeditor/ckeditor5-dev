/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deregisterAbortController, registerAbortController } from '../../lib/utils/abortcontroller.js';

vi.stubGlobal( 'process', {
	prependOnceListener: vi.fn(),
	removeListener: vi.fn()
} );

describe( 'abortcontroller', () => {
	let listeners;

	beforeEach( () => {
		listeners = {};

		vi.mocked( process ).prependOnceListener.mockImplementation( ( eventName, listener ) => {
			listeners[ eventName ] = new Set( [
				listener,
				...listeners[ eventName ] || []
			] );
		} );
		vi.mocked( process ).removeListener.mockImplementation( ( eventName, listener ) => {
			if ( listeners[ eventName ] ) {
				listeners[ eventName ].delete( listener );
			}
		} );
	} );

	describe( 'registerAbortController()', () => {
		it( 'should return AbortController instance', () => {
			const abortControllerInstance = registerAbortController();

			expect( abortControllerInstance ).to.be.instanceof( global.AbortController );
		} );

		it( 'should store listener in internal property for further use', () => {
			const abortControllerInstance = registerAbortController();

			expect( abortControllerInstance._listener ).to.be.a( 'function' );
		} );

		it( 'should register listener on SIGINT event', () => {
			const abortControllerInstance = registerAbortController();

			expect(
				vi.mocked( process ).prependOnceListener
			).toHaveBeenCalledExactlyOnceWith( 'SIGINT', abortControllerInstance._listener );
		} );

		it( 'should call abort method on SIGINT event', () => {
			const abortControllerInstance = registerAbortController();

			vi.spyOn( abortControllerInstance, 'abort' );

			listeners.SIGINT.forEach( listener => listener() );

			expect( abortControllerInstance.abort ).toHaveBeenCalledExactlyOnceWith( 'SIGINT' );
		} );
	} );

	describe( 'deregisterAbortController()', () => {
		it( 'should not deregister listener if AbortController instance is not set', () => {
			deregisterAbortController();
			expect( vi.mocked( process ).removeListener ).not.toHaveBeenCalled();
		} );

		it( 'should not deregister listener if AbortController instance is not registered', () => {
			const abortControllerInstance = new AbortController();
			deregisterAbortController( abortControllerInstance );

			expect( vi.mocked( process ).removeListener ).not.toHaveBeenCalled();
		} );

		it( 'should deregister listener if AbortController instance is registered', () => {
			const abortControllerInstance = registerAbortController();

			deregisterAbortController( abortControllerInstance );

			expect( vi.mocked( process ).removeListener ).toHaveBeenCalledExactlyOnceWith( 'SIGINT', abortControllerInstance._listener );
		} );
	} );
} );
