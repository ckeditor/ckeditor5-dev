/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module interface-augmentation/foobar
 */

import type { FooConfig } from '../index.js';

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
