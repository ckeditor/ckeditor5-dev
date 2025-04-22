/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/fires
 */

/**
 * @fires event-example
 * @fires event-non-existing
 * @fires property
 */
export class ClassWithFires {
	public property: number;

	constructor( property: number ) {
		this.property = property;
	}

	/**
	 * @fires event-example
	 * @fires event-non-existing
	 * @fires property
	 */
	public method(): void {}
}

/**
 * @eventName ~ClassWithFires#event-example
 */
export type EventExample = {
	name: string;
};
