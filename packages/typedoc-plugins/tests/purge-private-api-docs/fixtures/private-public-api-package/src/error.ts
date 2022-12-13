/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-public-api-package/error
 * @publicApi
 */

export class Error {
	private errorName: string;
	private codeId: number;

	constructor( name: string, code: number ) {
		this.errorName = name;
		this.codeId = code;
	}
}
