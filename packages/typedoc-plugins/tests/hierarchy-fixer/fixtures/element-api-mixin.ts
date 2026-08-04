/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/element-api-mixin
 */

import type { Constructor, Mixed } from './mixin.js';

export interface ElementApi {
	updateSourceElement( data?: string ): void;
}

export type ElementApiMixinConstructor<Base extends Constructor> = Mixed<Base, ElementApi>;

export function ElementApiMixin<Base extends Constructor>( base: Base ): ElementApiMixinConstructor<Base> {
	abstract class Mixin extends base implements ElementApi {
		public updateSourceElement( data?: string ): void {
			console.log( data );
		}
	}

	return Mixin as unknown as ElementApiMixinConstructor<Base>;
}
