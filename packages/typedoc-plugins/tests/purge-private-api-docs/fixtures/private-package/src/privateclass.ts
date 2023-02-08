/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package/privateclass
 */

export class PrivateClass {
	protected protectedValue: number;

	constructor( value: number ) {
		this.protectedValue = value;
	}
}
