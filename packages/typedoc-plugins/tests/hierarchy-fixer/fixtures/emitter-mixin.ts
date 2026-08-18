/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/emitter-mixin
 */

import type { Constructor, Mixed } from './mixin.js';

export interface Emitter {
	fire( eventName: string ): void;
}

export type EmitterMixinConstructor<Base extends Constructor | undefined = undefined> = Base extends Constructor ?
	Mixed<Base, Emitter> :
	{
		new (): Emitter;
		prototype: Emitter;
	};

export function EmitterMixin<Base extends Constructor>( base: Base ): EmitterMixinConstructor<Base>;

export function EmitterMixin(): EmitterMixinConstructor;

export function EmitterMixin( base?: Constructor ): unknown {
	if ( !base ) {
		abstract class EmitterMixin implements Emitter {
			public fire( eventName: string ): void {
				console.log( eventName );
			}
		}

		return EmitterMixin;
	}

	abstract class EmitterMixin extends base implements Emitter {
		public fire( eventName: string ): void {
			console.log( eventName );
		}
	}

	return EmitterMixin;
}
