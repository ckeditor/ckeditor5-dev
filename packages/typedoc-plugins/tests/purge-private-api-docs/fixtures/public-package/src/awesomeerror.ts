/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module public-package/awesomeerror
 * @publicApi
 */

export class AwesomeError {
	private errorName: string;
	private codeId: number;

	constructor( name: string, code: number ) {
		this.errorName = name;
		this.codeId = code;
	}
}
