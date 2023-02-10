/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-public-api-package/privateinheritor
 * @publicApi
 */

import { ClassInPrivatePackage } from '../../private-package/src/classinprivatepackage';

export class PrivateInheritor extends ClassInPrivatePackage {
	public ownValue: string;

	constructor( ownValue: string, publicValue: string, protectedValue: string ) {
		super( publicValue, protectedValue );

		this.ownValue = ownValue;
	}
}
