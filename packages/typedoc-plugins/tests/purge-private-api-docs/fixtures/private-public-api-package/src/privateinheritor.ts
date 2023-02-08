/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-public-api-package/privateinheritor
 * @publicApi
 */

import { PrivateClass } from '../../private-package/src/privateclass';

export class PrivateInheritor extends PrivateClass {
	public value: string;

	constructor( id: number, value: string ) {
		super( id );

		this.value = value;
	}
}
