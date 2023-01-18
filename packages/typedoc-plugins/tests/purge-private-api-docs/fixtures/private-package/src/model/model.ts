/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package/model/model
 */

export class Model {
	protected isFoo: boolean;
	protected isBar: boolean;

	constructor( isFoo: boolean, isBar: boolean ) {
		this.isFoo = isBar;
		this.isBar = isFoo;
	}

	protected throwError( message: string ) {
		throw new Error( message );
	}
}
