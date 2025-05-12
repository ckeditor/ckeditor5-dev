/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/eventsinvalid
 */

import ExampleClass from './exampleclass.js';

export default class EventsInvalidClass extends ExampleClass {
	public static create( value: string ): ExampleClass {
		/**
		 * An event not associated to anything in the source code.
		 *
		 * @eventName ~EventsInvalidClass#event-foo-not-associated-inside-method
		 */

		/**
		 * An event not associated to a type in the source code.
		 *
		 * @eventName module:eventsinvalid~EventsInvalidClass#event-foo-not-associated-to-type-inside-method
		 */
		return new ExampleClass( value );
	}
}

export function create( value: string ): ExampleClass {
	/**
	 * An event not associated to a type in the source code.
	 *
	 * @eventName ~EventsInvalidClass#event-foo-not-associated-to-type-inside-function
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
 * A relative event linked to a non-existing class.
 *
 * @eventName ~InvalidClass#event-foo-relative-invalid-class
 */
export type EventFooRelativeInvalidClass = {
	name: string;
};

/**
 * A relative event linked neither to a class, nor to an Observable interface.
 *
 * @eventName ~ExampleType#event-foo-relative-invalid-parent
 */
export type EventFooRelativeInvalidParent = {
	name: string;
};

/**
 * @eventName #event-foo-relative-invalid-name-with-separator
 */
export type EventFooRelativeInvalidNameWithSeparator = {
	name: string;
};

/**
 * @eventName event-foo-relative-invalid-name-without-separator
 */
export type EventFooRelativeInvalidNameWithoutSeparator = {
	name: string;
};

/**
 * An absolute event linked to a non-existing module.
 *
 * @eventName module:invalidmodule~EventsInvalidClass#event-foo-absolute-invalid-module
 */
export type EventFooAbsoluteInvalidModule = {
	name: string;
};

/**
 * An absolute event linked to a non-existing class.
 *
 * @eventName module:eventsvalid~InvalidClass#event-foo-absolute-invalid-class
 */
export type EventFooAbsoluteInvalidClass = {
	name: string;
};

/**
 * An absolute event linked neither to a class, nor to an Observable interface.
 *
 * @eventName module:eventsvalid~ExampleType#event-foo-absolute-invalid-parent
 */
export type EventFooAbsoluteInvalidParent = {
	name: string;
};

/**
 * An event not associated to anything in the source code.
 *
 * @eventName ~EventsInvalidClass#event-foo-not-associated-outside
 */
