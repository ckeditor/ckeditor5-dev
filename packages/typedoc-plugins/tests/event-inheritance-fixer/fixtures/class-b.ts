/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/class-b
 */

import { ClassA } from './class-a.js';

export class ClassB extends ClassA {}

/**
 * @eventName ~ClassB#event-3-class-b
 */
export type Event3ClassB = {
	name: string;
};
