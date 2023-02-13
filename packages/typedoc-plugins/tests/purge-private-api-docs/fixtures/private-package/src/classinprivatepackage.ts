/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package/classinprivatepackage
 */

export class ClassInPrivatePackage {
	public publicValue: string;
	protected protectedValue: string;

	/**
	 * @internal
	 */
	public _internalValue: string;

	constructor( publicValue: string, protectedValue: string, _internalValue: string ) {
		this.publicValue = publicValue;
		this.protectedValue = protectedValue;
		this._internalValue = _internalValue;
	}
}
