/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package/privatecollection
 */

export class PrivateCollection {
	public publicValue: string;
	protected protectedValue: string;
	private privateValue: string;

	/**
	 * @internal
	 */
	public _internalValue: string;

	declare public declarePublicValue: string;
	declare private declareProtectedValue: string;
	declare protected declarePrivateValue: string;

	/**
	 * @internal
	 */
	declare public _declareInternalValue: string;

	constructor() {
		this.publicValue = 'publicValue';
		this.protectedValue = 'protectedValue';
		this.privateValue = 'privateValue';
		this._internalValue = '_internalValue';

		this.declarePublicValue = 'declarePublicValue';
		this.declareProtectedValue = 'declareProtectedValue';
		this.declarePrivateValue = 'declarePrivateValue';
		this._declareInternalValue = '_declareInternalValue';
	}

	public getPublicFunction(): void {
	}

	protected getProtectedFunction(): void {
	}

	private getPrivateFunction(): void {
	}

	/**
	 * @internal
	 */
	public _getInternalFunction(): void {
	}
}

/**
 * @eventName ~PrivateCollection#privateCollectionEvent
 */
export type PrivateCollectionEvent = {
	name: 'privateCollectionEvent';
};
