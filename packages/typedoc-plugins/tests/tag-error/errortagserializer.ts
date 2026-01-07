/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type DeclarationReflection, type ParameterReflection, type Serializer } from 'typedoc';

import ErrorTagSerializer from '../../src/tag-error/errortagserializer.js';

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
			const globalSerializer = vi.fn() as unknown as Serializer;

			serializer.toObject(
				{
					isCKEditor5Error: true,
					parameters: []
				} as unknown as DeclarationReflection,
				result,
				globalSerializer
			);

			expect( result ).to.have.property( 'isCKEditor5Error', true );
		} );

		it( 'should serialize each parameter', () => {
			const result = {
				parameters: []
			};
			const globalSerializer = vi.fn() as unknown as Serializer;
			const firstParameter = {
				toObject: vi.fn()
			} as unknown as ParameterReflection;

			( firstParameter.toObject as Mock ).mockReturnValue( {
				type: 'test'
			} );

			serializer.toObject(
				{
					parameters: [
						firstParameter
					]
				} as unknown as DeclarationReflection,
				result,
				globalSerializer
			);

			expect( result ).to.have.property( 'parameters' );
			expect( result.parameters ).toEqual( expect.arrayContaining( [ {
				type: 'test'
			} ] ) );

			expect( firstParameter.toObject ).toHaveBeenCalledOnce();
			expect( firstParameter.toObject ).toHaveBeenCalledWith( globalSerializer );
		} );
	} );
} );
