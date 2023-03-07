/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/interface-b
 */

import type { InterfaceA } from './interface-a';

export interface InterfaceB extends InterfaceA {}

/**
 * @eventName ~InterfaceB#event-3-interface-b
 */
export type Event3InterfaceB = {
	name: string;
};
