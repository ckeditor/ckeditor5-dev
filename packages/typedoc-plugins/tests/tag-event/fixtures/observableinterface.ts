/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/observableinterface
 */

export default class ExampleClass {}

export interface NonObservable {
	set( name: any ): void;
}

export interface Observable {
	set( name: any ): void;
}

/**
 * Fired when a property changed value.
 *
 * @eventName change:{property}
 * @param name The property name.
 * @param value The new property value.
 * @param oldValue The previous property value.
 */
export type ObservableChangeEvent = {
	name: 'change' | `change:${ string }`;
	args: [
		name: string,
		value: any,
		oldValue: any
	];
};

/**
 * Fired when a property value is going to be set but is not set yet (before the `change` event is fired).
 *
 * @eventName set:{property}
 * @param name The property name.
 * @param value The new property value.
 * @param oldValue The previous property value.
 */
export type ObservableSetEvent = {
	name: 'set' | `set:${ string }`;
	args: [
		name: string,
		value: any,
		oldValue: any
	];
	return: any;
};
