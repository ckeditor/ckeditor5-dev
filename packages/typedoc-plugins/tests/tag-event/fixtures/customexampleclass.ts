/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/customexampleclass
 */

import ExampleClass from './exampleclass';

export default class CustomExampleClass extends ExampleClass {
	public static create( value: string ): ExampleClass {
		/**
		 * An event not associated to anything in the source code.
		 *
		 * @eventName event-foo-not-associated-inside-method
		 */

		/**
		 * An event not associated to a type in the source code.
		 *
		 * @eventName event-foo-not-associated-to-type-inside-method
		 */
		return new ExampleClass( value );
	}
}

export class CustomExampleNonDefaultClass extends ExampleClass {}

export function create( value: string ): ExampleClass {
	/**
	 * An event not associated to a type in the source code.
	 *
	 * @eventName event-foo-not-associated-to-type-inside-function
	 */
	return new ExampleClass( value );
}

/**
 * Normal type export.
 */
export type ExampleType = {
	name: string;
};

/**
 * @eventName event-foo-no-text
 */
export type EventFooNoText = {
	name: string;
};

/**
 * An event associated with the type.
 *
 * @eventName event-foo
 */
export type EventFoo = {
	name: string;
};

/**
 * An event associated with the type. Event with three params.
 *
 * See {@link ~CustomExampleClass} or {@link module:fixtures/customexampleclass~CustomExampleClass Custom label}. A text after.
 *
 * @eventName event-foo-with-params
 *
 * @param p1 Description for first param.
 * @param p2 Description for second param.
 * @param p3 Complex {@link module:utils/object~Object description} for `third param`.
 * @deprecated
 */
export type EventFooWithParams = {
	name: string;
	args: [
		p1: string,
		p2: number,
		p3: ExampleType
	];
};

/**
 * @eventName event-foo-no-content
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type EventFooNoContent = {};

/**
 * @eventName event-foo-empty-args
 */
export type EventFooEmptyArgs = {
	args: [];
};

/**
 * @eventName event-foo-optional-args
 */
export type EventFooOptionalArgs = {
	args: [
		p1: string,
		p2?: number
	];
};

/**
 * @eventName event-foo-inline-args
 *
 * @param p1 Description for first param.
 */
export type EventFooInlineArgs = {
	args: [
		{
			p1: number;
		}
	];
};

/**
 * @eventName event-foo-anonymous-args
 */
export type EventFooAnonymousArgs = {
	args: [ number, { foo: boolean } ];
};

/**
 * @eventName event-foo-anonymous-optional-args
 */
export type EventFooAnonymousOptionalArgs = {
	args: [ number?, { foo: boolean }? ];
};

export type TypeWithParams = {
	name: string;
	args: [
		p1: string,
		p2: ExampleType
	];
};

export type TypeReferenceLvl1 = TypeWithParams;
export type TypeReferenceLvl2 = TypeReferenceLvl1;

/**
 * @eventName event-foo-reference
 *
 * @param p1 Description for first param.
 * @param p2 Description for second param.
 */
export type EventFooReference = TypeReferenceLvl2;

export type TypeGenericLvl1<T> = T & {
	name: 'Level 1';
};

export type TypeGenericLvl2<T> = TypeGenericLvl1<T> & {
	name: 'Level 2';
};

export type TypeGenericLvl3<T> = TypeGenericLvl2<T> & {
	name: 'Level 3';
};

/**
 * @eventName event-foo-generic-from-type-arg
 */
export type EventFooGeneric = TypeGenericLvl3<{
	args: [
		p1: string,
		p2: ExampleType
	];
}>;

export type OtherTypeGenericLvl1<T> = T & {
	name: 'Level 1';
	args: [
		p1: string,
		p2: ExampleType
	];
};

export type OtherTypeGenericLvl2<T> = OtherTypeGenericLvl1<T> & {
	name: 'Level 2';
};

export type OtherTypeGenericLvl3<T = object> = OtherTypeGenericLvl2<T> & {
	name: 'Level 3';
};

/**
 * @eventName event-foo-generic-from-base-type
 */
export type OtherEventFooGeneric = OtherTypeGenericLvl3;

/**
 * @eventName event-foo-complex
 */
export type EventFooComplex<Param extends 'a' | 'b' | 'c' = 'a'> = {
	args: Param extends 'c' ?
		[ p1: string, p2: ExampleType ] :
		[];
};

/**
 * An event not associated to anything in the source code.
 *
 * @eventName event-foo-not-associated-outside
 */
