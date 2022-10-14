/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/class-a
 */

/**
 * @fires event-1-class-a
 * @fires event-2-class-a
 */
export class ClassA {}

/**
 * Event 1 from class A.
 *
 * @eventName event-1-class-a
 *
 * @param {String} p1 Description for first param.
 * @param {module:utils/object~Object} p2 Description for second param.
 * @param p3 Complex {@link module:utils/object~Object description} for `third param`.
 */
export type Event1ClassA = {
	name: string;
	args: [ {
		p1: string;
		p2: number;
		p3: boolean;
	} ];
};

/**
 * Event 2 from class A.
 *
 * @eventName event-2-class-a
 */
export type Event2ClassA = {
	name: string;
};
