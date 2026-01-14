/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/interface-e
 */

export interface InterfaceE extends TFoo {
	foo(): void;
}

export type TFoo = {
	bar(): void;
};

/**
 * @eventName ~InterfaceE#event-1-interface-e
 */
export type Event1InterfaceE = {
	name: string;
};
