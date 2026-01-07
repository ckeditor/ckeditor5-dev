/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/error
 */

export default class Error {
	protected errorName: string;

	constructor( errorName: string ) {
		this.errorName = errorName;
	}

	public get name(): string {
		return this.errorName;
	}
}
