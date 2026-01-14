/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/fires
 */

/**
 * @fires example
 * @fires class-non-existing
 * @fires class-property
 */
export class ClassWithFires {
	public property: number;

	constructor( property: number ) {
		this.property = property;
	}

	/**
	 * @fires example
	 * @fires method-non-existing
	 * @fires method-property
	 */
	public method(): void {}
}

/**
 * @eventName ~ClassWithFires#example
 */
export type EventExample = {
	name: string;
};

/**
 * @eventName ~ClassWithFires#set:example
 * @eventName ~ClassWithFires#change:example
 */
export type EventObservableExample = {
	name: string;
};
