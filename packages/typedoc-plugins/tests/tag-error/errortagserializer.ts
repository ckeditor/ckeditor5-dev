/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { type DeclarationReflection } from 'typedoc';

import ErrorTagSerializer from '../../src/tag-error/errortagserializer';

describe( 'typedoc-plugins/errortagserializer', () => {
	let serializer: ErrorTagSerializer;

	beforeEach( () => {
		serializer = new ErrorTagSerializer();
	} );

	describe( '#priority', () => {
		it( 'should be defined', () => {
			expect( serializer.priority ).toBeTypeOf( 'number' );
		} );
	} );

	describe( 'supports()', () => {
		it( 'should process a reflection containing the `isCKEditor5Error` property', () => {
			expect( serializer.supports( { isCKEditor5Error: true } as unknown as DeclarationReflection ) ).toBe( true );
			expect( serializer.supports( {} as unknown as DeclarationReflection ) ).toBe( false );
		} );
	} );

	describe( 'toObject()', () => {
		it( 'should return an object with the `isCKEditor5Error` property', () => {
			const result = {};

			serializer.toObject(
				{
					isCKEditor5Error: true,
					parameters: []
				} as unknown as DeclarationReflection,
				result
			);

			expect( result ).to.have.property( 'isCKEditor5Error', true );
		} );
	} );
} );
