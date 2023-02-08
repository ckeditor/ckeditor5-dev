/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-public-api-package/publicinheritor
 * @publicApi
 */

import { PublicClass } from '../../public-package/src/publicclass';

export class PublicInheritor extends PublicClass {
	public value: string;

	constructor( id: number, value: string ) {
		super( id );

		this.value = value;
	}
}
