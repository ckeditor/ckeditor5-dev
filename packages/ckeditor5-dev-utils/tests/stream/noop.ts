/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import stream from 'stream';
import noop from '../../src/stream/noop.js';

describe( 'noop()', () => {
	it( 'should return PassTrough stream', () => {
		const PassThrough = stream.PassThrough;
		const ret = noop();
		expect( ret instanceof PassThrough ).to.equal( true );
	} );

	it( 'should return a duplex stream when given a callback and call that callback', () => {
		const spy = vi.fn();
		const ret = noop( spy );

		ret.write( 'foo' );

		expect( spy ).toHaveBeenCalledOnce();
		expect( ret.writable ).to.equal( true );
		expect( ret.readable ).to.equal( true );
	} );

	it( 'should wait until a promise returned by the callback is resolved', () => {
		let resolved = false;
		let resolve;

		const stream = noop( () => {
			return new Promise( r => {
				resolve = r;
			} );
		} );

		stream
			.pipe(
				noop( () => {
					expect( resolved ).to.equal( true );
				} )
			);

		stream.write( 'foo' );

		resolved = true;
		resolve();
	} );

	it( 'should fail when a returned promise is rejected', () => {
		return new Promise( done => {
			const chunks = [];
			const stream = noop( chunk => {
				return new Promise( ( resolve, reject ) => {
					if ( chunk === 'foo' ) {
						reject();
					} else {
						resolve();
					}
				} );
			} );

			stream.pipe( noop( chunk => {
				chunks.push( chunk );
			} ) );

			stream.on( 'end', () => {
				expect( chunks.join() ).to.equal( 'bar' );
				done();
			} );

			stream.write( 'foo' );
			stream.write( 'bar' );
			stream.end();
		} );
	} );
} );
