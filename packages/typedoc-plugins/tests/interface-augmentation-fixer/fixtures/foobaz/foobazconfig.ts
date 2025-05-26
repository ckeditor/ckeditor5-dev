/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module interface-augmentation/foobaz
 */

// Module augmentation that points to the re-exported (empty) interface in "index.ts" file.
declare module '../' {
	interface FoobarConfig {
		propertyFoobazIndex: number;
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FoobazConfig {}
