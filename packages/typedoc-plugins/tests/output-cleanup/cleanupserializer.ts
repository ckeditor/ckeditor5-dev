/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { type DeclarationReflection } from 'typedoc';

import CleanUpSerializer from '../../src/output-cleanup/cleanupserializer.js';

describe( 'typedoc-plugins/cleanupserializer', () => {
	let serializer: CleanUpSerializer;

	beforeEach( () => {
		serializer = new CleanUpSerializer();
	} );

	describe( '#priority', () => {
		it( 'should be defined', () => {
			expect( serializer.priority ).toBeTypeOf( 'number' );
		} );
	} );

	describe( 'supports()', () => {
		it( 'should process all reflections', () => {
			expect( serializer.supports() ).toBe( true );
		} );
	} );

	describe( 'toObject()', () => {
		it( 'should return an object without the `groups` property', () => {
			const result = {
				id: 6,
				name: 'FooConfig',
				kind: 2097152,
				groups: [
					{
						title: 'Properties',
						children: [ 8 ]
					}
				]
			} as unknown as DeclarationReflection;

			serializer.toObject(
				{} as unknown as DeclarationReflection,
				result
			);

			expect( result ).not.to.have.property( 'groups' );
			expect( result ).to.deep.equal( {
				id: 6,
				name: 'FooConfig',
				kind: 2097152
			} );
		} );
	} );
} );
