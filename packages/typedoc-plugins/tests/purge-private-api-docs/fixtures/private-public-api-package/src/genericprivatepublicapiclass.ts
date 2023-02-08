/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-public-api-package/genericprivatepublicapiclass
 * @publicApi
 */

export class GenericPrivatePublicApiClass {
	public publicValue: string;
	private privateValue: number;

	constructor( publicValue: string, privateValue: number ) {
		this.publicValue = publicValue;
		this.privateValue = privateValue;
	}
}
