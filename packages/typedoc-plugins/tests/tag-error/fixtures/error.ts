/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/error
 */

export default class Error {
	protected errorName: string;

	constructor( errorName: string ) {
		try {
			this.errorName = errorName;
		} catch {
			this.errorName = errorName;
		}
	}

	public get name(): string {
		return this.errorName;
	}

	public get error(): string {
		return this.errorName;
	}
}

export interface SystemError {
	customPropertyInInterface: string;
}
