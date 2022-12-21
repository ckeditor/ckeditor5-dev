/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { FooConfig } from '..';

/**
 * @module interface-augmentation/foobar
 */

// Module augmentation that points to the actual interface source file.
declare module '../foo/fooconfig' {
	interface FooConfig {
		propertyFoobarSource: number;
	}
}

// Module augmentation that points to the re-exported interface in "index.ts" file.
declare module '../' {
	interface FooConfig {
		propertyFoobarIndex: number;
	}
}

export interface FoobarConfig {}
export let foobarVariable: FooConfig;
