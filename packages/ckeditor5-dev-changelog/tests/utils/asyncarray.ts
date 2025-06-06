/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { AsyncArray } from '../../src/utils/asyncarray.js';

describe( 'AsyncArray', () => {
	describe( 'from()', () => {
		it( 'should create an async array and return its value', async () => {
			const arr = AsyncArray.from( Promise.resolve( [ 1, 2, 3 ] ) );
			const result = await arr.then( a => a.map( x => x * 2 ) );

			expect( result ).toEqual( [ 2, 4, 6 ] );
		} );
	} );

	describe( 'map()', () => {
		it( 'should return a mapped value from a promise (sync callback)', async () => {
			const arr = AsyncArray.from( Promise.resolve( [ 1, 2, 3 ] ) );
			const result = await arr.map( x => x + 1 ).then( res => res );

			expect( result ).toEqual( [ 2, 3, 4 ] );
		} );

		it( 'should return a mapped value from a promise (async callback)', async () => {
			const arr = AsyncArray.from( Promise.resolve( [ 1, 2, 3 ] ) );
			const result = await arr.map( async x => x * 2 ).then( res => res );

			expect( result ).toEqual( [ 2, 4, 6 ] );
		} );
	} );

	describe( 'flat()', () => {
		it( 'should return a promise without nesting', async () => {
			const arr = AsyncArray.from( Promise.resolve( [ [ 1, 2 ], [ 3, 4 ] ] ) );
			const result = await arr.flat().then( res => res );

			expect( result ).toEqual( [ 1, 2, 3, 4 ] );
		} );
	} );

	describe( 'flatMap()', () => {
		it( 'should return a flat structure and map its value based on a promise (sync callback)', async () => {
			const arr = AsyncArray.from( Promise.resolve( [ 1, 2 ] ) );
			const result = await arr.flatMap( x => [ x, x * 10 ] ).then( res => res );

			expect( result ).toEqual( [ 1, 10, 2, 20 ] );
		} );

		it( 'should return a flat structure and map its value based on a promise (async callback)', async () => {
			const arr = AsyncArray.from( Promise.resolve( [ 1, 2 ] ) );
			const result = await arr.flatMap( async x => [ x, x * 10 ] ).then( res => res );

			expect( result ).toEqual( [ 1, 10, 2, 20 ] );
		} );
	} );
} );
