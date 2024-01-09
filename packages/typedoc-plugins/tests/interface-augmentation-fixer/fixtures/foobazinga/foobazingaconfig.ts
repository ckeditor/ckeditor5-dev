/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
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

export interface FoobazingaConfig {}
