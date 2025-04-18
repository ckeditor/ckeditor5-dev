/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Serializer, DeclarationReflection, ParameterReflection } from 'typedoc';

import EventTagSerializer, { type PartialObject } from '../../src/tag-event/eventtagserializer';

describe( 'typedoc-plugins/eventtagserializer', () => {
	let serializer: EventTagSerializer;

	beforeEach( () => {
		serializer = new EventTagSerializer();
	} );

	describe( '#priority', () => {
		it( 'should be defined', () => {
			expect( serializer.priority ).toBeTypeOf( 'number' );
		} );
	} );

	describe( 'supports()', () => {
		it( 'should process a reflection containing the `ckeditor5Events` property', () => {
			expect( serializer.supports( { ckeditor5Events: true } as unknown as DeclarationReflection ) ).toBe( true );
			expect( serializer.supports( {} as unknown as DeclarationReflection ) ).toBe( false );
		} );
	} );

	describe( 'toObject()', () => {
		let input: DeclarationReflection,
			result: PartialObject,
			serializerCallback: Serializer;

		beforeEach( () => {
			serializerCallback = ( () => {} ) as unknown as Serializer;

			input = {
				ckeditor5Events: []
			} as unknown as DeclarationReflection;

			result = {
				ckeditor5Events: []
			};
		} );

		it( 'should return an object with the `ckeditor5Events` property', () => {
			serializer.toObject( input, result, serializerCallback );

			expect( result.ckeditor5Events ).toEqual( [] );
		} );

		it( 'should convert reflections from the `ckeditor5Events` property', () => {
			const eventReflectionConverted = {
				name: 'eventReflectionConverted'
			};

			const eventReflection = {
				toObject: vi.fn( () => eventReflectionConverted ),
				parameters: []
			} as unknown as DeclarationReflection;

			const result = {
				ckeditor5Events: []
			};

			input.ckeditor5Events = [ eventReflection ];

			serializer.toObject( input, result, serializerCallback );

			expect( eventReflection.toObject ).toHaveBeenCalledWith( serializerCallback );

			expect( result.ckeditor5Events ).toHaveLength( 1 );
			expect( result.ckeditor5Events[ 0 ] ).toEqual( {
				name: 'eventReflectionConverted',
				parameters: []
			} );
		} );

		it( 'should convert reflection parameters from the `ckeditor5Events` property', () => {
			const eventReflectionParametersConverted = {
				name: 'eventReflectionParametersConverted'
			};

			const eventReflectionParameter = {
				toObject: vi.fn( () => eventReflectionParametersConverted )
			} as unknown as ParameterReflection;

			const eventReflectionConverted = {
				name: 'eventReflectionConverted'
			};

			const eventReflection = {
				toObject: vi.fn( () => eventReflectionConverted ),
				parameters: [ eventReflectionParameter ]
			} as unknown as DeclarationReflection;

			const result = {
				ckeditor5Events: []
			};

			input.ckeditor5Events = [ eventReflection ];

			serializer.toObject( input, result, serializerCallback );

			expect( eventReflectionParameter.toObject ).toHaveBeenCalledWith( serializerCallback );

			expect( result.ckeditor5Events ).toHaveLength( 1 );
			expect( result.ckeditor5Events[ 0 ] ).toEqual( {
				name: 'eventReflectionConverted',
				parameters: [ {
					name: 'eventReflectionParametersConverted'
				} ]
			} );
		} );
	} );
} );
