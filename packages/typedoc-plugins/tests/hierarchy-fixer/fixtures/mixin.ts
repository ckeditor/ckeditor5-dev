/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/mixin
 */

export type Constructor<Instance = object> = abstract new ( ...args: Array<any> ) => Instance;

export type Mixed<Base extends Constructor, Mixin extends object> = {
	new ( ...args: ConstructorParameters<Base> ): Mixin & InstanceType<Base>;
	prototype: Mixin & InstanceType<Base>;
} & {
	// Include all static fields from Base.
	[ K in keyof Base ]: Base[ K ];
};
