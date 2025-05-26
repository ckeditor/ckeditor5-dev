/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/eventsvalid
 */

import ExampleClass from './exampleclass.js';

export default class EventsValidClass extends ExampleClass {}
export class EventsValidAnotherClass extends ExampleClass {}

/**
 * Normal type export.
 */
export type ExampleType = {
	name: string;
};

/**
 * @eventName ~EventsValidClass#event-foo-no-text
 */
export type EventFooNoText = {
	name: string;
};

/**
 * An event associated with the type.
 *
 * @eventName ~EventsValidClass#event-foo
 */
export type EventFoo = {
	name: string;
};

/**
 * An event associated with the type. Event with three params.
 *
 * See {@link ~EventsValidClass} or {@link module:fixtures/eventsvalid~EventsValidClass Custom label}. A text after.
 *
 * @eventName ~EventsValidClass#event-foo-with-params
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
 * @eventName ~EventsValidClass#event-foo-no-content
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EventFooNoContent = {};

/**
 * @eventName ~EventsValidClass#event-foo-empty-args
 */
export type EventFooEmptyArgs = {
	args: [];
};

/**
 * @eventName ~EventsValidClass#event-foo-optional-args
 */
export type EventFooOptionalArgs = {
	args: [
		p1: string,
		p2?: number
	];
};

/**
 * @eventName ~EventsValidClass#event-foo-inline-args
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
 * @eventName ~EventsValidClass#event-foo-anonymous-args
 */
export type EventFooAnonymousArgs = {
	args: [ number, { foo: boolean } ];
};

/**
 * @eventName ~EventsValidClass#event-foo-anonymous-optional-args
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
 * @eventName ~EventsValidClass#event-foo-reference
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
 * @eventName ~EventsValidClass#event-foo-generic-from-type-arg
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
 * @eventName ~EventsValidClass#event-foo-generic-from-base-type
 */
export type OtherEventFooGeneric = OtherTypeGenericLvl3;

/**
 * @eventName ~EventsValidClass#event-foo-complex
 */
export type EventFooComplex<Param extends 'a' | 'b' | 'c' = 'a'> = {
	args: Param extends 'c' ?
		[ p1: string, p2: ExampleType ] :
		[];
};

/**
 * @eventName module:fixtures/eventsvalid~EventsValidClass#event-foo-absolute
 */
export type EventFooAbsolute = {
	name: string;
};

/**
 * @eventName module:fixtures/eventsvalid~EventsValidClass#event-foo-absolute-with-prefix
 */
export type EventFooAbsoluteWithPrefix = {
	name: string;
};

/**
 * @eventName module:fixtures/exampleinterface~ExampleInterface#event-change:{property}
 */
export type InterfaceChangeEvent = {
	name: 'change' | `change:${ string }`;
	args: [
		name: string,
		value: any,
		oldValue: any
	];
};

/**
 * @eventName module:fixtures/exampleinterface~ExampleInterface#event-set:{property}
 */
export type InterfaceSetEvent = {
	name: 'set' | `set:${ string }`;
	args: [
		name: string,
		value: any,
		oldValue: any
	];
	return: any;
};

/**
 * @eventName ~EventsValidClass#event-foo-multiple-names
 * @eventName ~EventsValidClass#event-foo-multiple-names:variant
 * @eventName ~EventsValidAnotherClass#event-foo-multiple-names:variant:subvariant
 */
export type EventFooMultipleNames = {
	name: string;
};
