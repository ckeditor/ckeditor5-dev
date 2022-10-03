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
		 * An event not related to a type in the source code. This kind of event is silently ignored by TypeDoc.
		 *
		 * @eventName event-foo-not-associated-to-type-inside-method
		 */
		return new ExampleClass( value );
	}
}

export function create( value: string ): ExampleClass {
	/**
	 * An event not related to a type in the source code. This kind of event is silently ignored by TypeDoc.
	 *
	 * @eventName event-foo-not-associated-to-type-inside-function
	 */
	return new ExampleClass( value );
}

/**
 * @eventName event-foo-associated-with-type-no-text
 */
export type FooEventNoText = {
	name: string;
};

/**
 * An event associated with the type.
 *
 * @eventName event-foo-associated-with-type
 */
export type FooEvent = {
	name: string;
};

/**
 * An event associated with the type. Event with three params.
 *
 * See {@link ~CustomExampleClass} or {@link module:fixtures/customexampleclass~CustomExampleClass Custom label}. A text after.
 *
 * @eventName event-foo-associated-with-type-with-params
 *
 * @param {String} p1 Description for first param.
 * @param {module:utils/object~Object} p2 Description for second param.
 * @param p3 Complex {@link module:utils/object~Object description} for `third param`.
 */
export type FooEventWithParams = {
	name: string;
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
