/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/observable-mixin
 */

import type { Constructor, Mixed } from './mixin.js';

export interface Observable {
	set( name: string, value: unknown ): void;
}

export type ObservableMixinConstructor<Base extends Constructor | undefined = undefined> = Base extends Constructor ?
	Mixed<Base, Observable> :
	{
		new (): Observable;
		prototype: Observable;
	};

export function ObservableMixin<Base extends Constructor>( base: Base ): ObservableMixinConstructor<Base>;

export function ObservableMixin(): ObservableMixinConstructor;

export function ObservableMixin( base?: Constructor ): unknown {
	if ( !base ) {
		abstract class ObservableMixin {}

		return ObservableMixin;
	}

	abstract class ObservableMixin extends base {}

	return ObservableMixin;
}

/**
 * @eventName ~Observable#observable-property
 */
export type ObservablePropertyEvent = {
	name: string;
	args: [];
};
