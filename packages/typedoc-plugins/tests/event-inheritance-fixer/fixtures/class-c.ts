/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/class-c
 */

import { ClassB } from './class-b.js';

export class ClassC extends ClassB {}

/**
 * Overwritten event 2 from class A.
 *
 * @eventName ~ClassC#event-2-class-a
 */
export type Event2ClassA = {
	name: string;
};
