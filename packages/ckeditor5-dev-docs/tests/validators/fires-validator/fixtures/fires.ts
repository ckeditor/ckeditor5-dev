/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/fires
 */

/**
 * @fires event
 * @fires event-non-existing
 * @fires property
 */
export class ClassWithFires {
	public property: number;

	constructor( property: number ) {
		this.property = property;
	}

	/**
	 * @fires event
	 * @fires event-non-existing
	 * @fires property
	 */
	public method(): void {}
}

/**
 * @eventName event
 */
export type Event = {
	name: string;
};
