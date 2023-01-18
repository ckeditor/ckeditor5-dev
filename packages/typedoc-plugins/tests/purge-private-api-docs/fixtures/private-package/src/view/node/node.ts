/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package/view/node/node
 */

export class Node {
	protected name: string;

	constructor( name: string ) {
		this.name = name.toLowerCase();
	}
}
