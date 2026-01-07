/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/mixin
 */

// Simplified CKEditor 5 source for testing purposes only.

export type Mixed<Base extends Constructor, Mixin extends object> = {
	new ( ...args: ConstructorParameters<Base> ): InstanceType<Base> & Mixin;
	prototype: InstanceType<Base> & Mixin;
} & {
	[ K in keyof Base ]: Base[ K ];
};

export type Constructor<Instance = object> = abstract new ( ...args: Array<any> ) => Instance;

export default function Mixin<Base extends Constructor>( base: Base ): Mixed<Base, object>;

export default function Mixin( base: Constructor ): unknown {
	abstract class Mixin extends base {
	}

	return Mixin;
}
