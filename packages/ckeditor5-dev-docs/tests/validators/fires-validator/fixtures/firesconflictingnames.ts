/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/firesconflictingnames
 */

/**
 * @fires event
 */
export class ClassWithFiresConflictingNames {
	public event: number;

	constructor( event: number ) {
		this.event = event;
	}

	/**
	 * @fires event
	 */
	public method(): void {}
}

/**
 * @eventName event
 */
export type Event = {
	name: string;
};
