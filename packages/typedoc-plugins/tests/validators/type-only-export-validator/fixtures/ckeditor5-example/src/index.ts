/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module example
 */

// Invalid: class exported as type-only declaration.
export type { MyClass } from './definitions.js';

// Invalid: class exported as per-specifier type-only.
export { type AnotherClass } from './definitions.js';

// Invalid: class with alias exported as type-only.
export type { AliasedClass as RenamedClass } from './definitions.js';

// Invalid: class exported as per-specifier type-only in a mixed export.
export { type MixedClass, myConst } from './definitions.js';

// Valid: interface exported as type-only is fine.
export type { MyInterface } from './definitions.js';

// Valid: type alias exported as type-only is fine.
export type { MyTypeAlias } from './definitions.js';

// Valid: function as value export is fine.
export { myFunction } from './definitions.js';

// Valid: declare class exported as type-only is fine (ambient declaration).
export type { DeclareClass } from './definitions.js';

// Valid: namespace (star) re-export is ignored by the validator.
export * from './definitions.js';
