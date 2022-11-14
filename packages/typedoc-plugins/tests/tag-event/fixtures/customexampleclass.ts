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
 * @param {String} p1 Description for first param.
 * @param {module:utils/object~Object} p2 Description for second param.
 * @param p3 Complex {@link module:utils/object~Object description} for `third param`.
 * @deprecated
 */
export type EventFooWithParams = {
	name: string;
	args: [ {
		p1: string;
		p2: number;
		p3: boolean;
	} ];
};

/**
 * An event not associated to anything in the source code.
 *
 * @eventName event-foo-not-associated-outside
 */
