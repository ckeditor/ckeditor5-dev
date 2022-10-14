/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/class-b
 */

import { ClassA } from './class-a';

/**
 * @fires event-3-class-b
 */
export class ClassB extends ClassA {}

/**
 * @eventName event-3-class-b
 */
export type Event3ClassB = {
	name: string;
};
