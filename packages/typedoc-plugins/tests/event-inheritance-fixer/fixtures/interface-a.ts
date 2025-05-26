/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/interface-a
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterfaceA {}

/**
 * Event 1 from interface A.
 *
 * @eventName ~InterfaceA#event-1-interface-a
 *
 * @param {string} p1 Description for first param.
 * @param {module:utils/object~Object} p2 Description for second param.
 * @param p3 Complex {@link module:utils/object~Object description} for `third param`.
 */
export type Event1InterfaceA = {
	name: string;
	args: [
		p1: string,
		p2: number,
		p3: boolean
	];
};

/**
 * Event 2 from interface A.
 *
 * @eventName ~InterfaceA#event-2-interface-a
 */
export type Event2InterfaceA = {
	name: string;
};
