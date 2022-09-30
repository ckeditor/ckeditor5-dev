/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/customexampleclass
 */

import ExampleClass from './exampleclass';

export default class CustomExampleClass extends ExampleClass {
	public static create( value: string ): ExampleClass {
		/**
		 * An event not related to anything in the source code. This kind of event is silently ignored by TypeDoc.
		 *
		 * @eventName event-foo-not-associated-inside-method
		 */

		/**
		 * An event occurring inside a method.
		 *
		 * @eventName event-foo-with-params-inside-method
		 *
		 * @param {String} p1 A description for first param.
		 * @param {Number} p2 A description for second param.
		 * @param {Boolean} p3 A description for third param.
		 */
		return new ExampleClass( value );
	}
}

export function create( value: string ): ExampleClass {
	/**
	 * An event occurring inside a function.
	 *
	 * @eventName event-foo-with-params-inside-function
	 *
	 * @param {String} p1 A description for first param.
	 * @param {Number} p2 A description for second param.
	 * @param {Boolean} p3 A description for third param.
	 */
	return new ExampleClass( value );
}

/**
 * An event associated with the type.
 *
 * @eventName event-foo-associated-with-type
 */
export type FooEvent = {
	name: 'foo';
};

/**
 * An event associated with the type.
 *
 * Event with three params.
 *
 * @eventName event-foo-with-params-associated-with-type
 *
 * @param {String} p1 A description for first param.
 * @param {Number} p2 A description for second param.
 * @param {Boolean} p3 A description for third param.
 */
export type FooEventWithParams = {
	name: 'foo';
	args: [ {
		p1: string;
		p2: number;
		p3: boolean;
	} ];
};

/**
 * An event not related to anything in the source code. This kind of event is silently ignored by TypeDoc.
 *
 * @eventName event-foo-not-associated-outside
 */
