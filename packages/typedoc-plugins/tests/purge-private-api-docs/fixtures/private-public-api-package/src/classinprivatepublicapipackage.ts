/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-public-api-package/classinprivatepublicapipackage
 * @publicApi
 */

export class ClassInPrivatePublicApiPackage {
	public publicValue: string;
	protected protectedValue: string;
	private privateValue: string;

	/**
	 * @internal
	 */
	public _internalValue: string;

	constructor( publicValue: string, protectedValue: string, privateValue: string, _internalValue: string ) {
		this.publicValue = publicValue;
		this.protectedValue = protectedValue;
		this.privateValue = privateValue;
		this._internalValue = _internalValue;
	}
}
