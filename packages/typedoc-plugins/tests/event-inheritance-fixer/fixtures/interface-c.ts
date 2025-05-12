/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/interface-c
 */

import type { InterfaceB } from './interface-b.js';

export interface InterfaceC extends InterfaceB {}

/**
 * Overwritten event 2 from interface A.
 *
 * @eventName ~InterfaceC#event-2-interface-a
 */
export type Event2InterfaceA = {
	name: string;
};
