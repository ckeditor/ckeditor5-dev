/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module public-package/publicclass
 */

export class PublicClass {
	protected protectedValue: number;

	constructor( value: number ) {
		this.protectedValue = value;
	}
}
