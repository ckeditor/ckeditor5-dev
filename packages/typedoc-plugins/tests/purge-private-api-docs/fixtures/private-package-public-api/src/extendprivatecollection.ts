/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package-public-api/extendprivatecollection
 * @publicApi
 */

import { PrivateCollection } from '../../private-package/src/privatecollection.js';

export class ExtendPrivateCollection extends PrivateCollection {
	public isPrivate: boolean = true;
	private parent: ExtendPrivateCollection | null = null;

	protected constructor() {
		super();
	}

	protected get awesomeProtectedNumber(): number {
		return 0;
	}

	private get awesomePrivateNumber(): number {
		return 0;
	}

	/**
	 * @internal
	 */
	public get _awesomeInternalNumber(): number {
		return 0;
	}
}

/**
 * @eventName ~ExtendPrivateCollection#extendPrivateCollectionEvent
 */
export type ExtendPrivateCollectionEvent = {
	name: 'extendPrivateCollectionEvent';
};
