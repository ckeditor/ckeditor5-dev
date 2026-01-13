/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module interface-augmentation/foobazinga
 */

// Module augmentation that points to the actual (empty) interface source file.
declare module '../foobaz/foobazconfig' {
	interface FoobazConfig {
		propertyFoobazingaSource: number;
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FoobazingaConfig {}
