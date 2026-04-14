/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module example/definitions
 */

// Invalid: class — must not be type-only exported.
export class MyClass {
	public value = 1;
}

// Invalid: class — must not be type-only exported.
export class AnotherClass {
	public name = 'test';
}

// Invalid: class — must not be type-only exported (aliased re-export).
export class AliasedClass {
	public id = 0;
}

// Valid: interface — type-only export is fine.
export interface MyInterface {
	foo: string;
}

// Valid: type alias — type-only export is fine.
export type MyTypeAlias = {
	bar: number;
};

// Valid: function — value export.
export function myFunction(): void {
	// noop
}

// Valid: constant — value export.
export const myConst = 42;

// Invalid: class — must not be type-only exported (mixed export).
export class MixedClass {
	public data = true;
}

// Valid: declare class — ambient declaration, no runtime value.
export declare class DeclareClass {
	public disableSomething(): void;
	public enableSomething(): void;
}
