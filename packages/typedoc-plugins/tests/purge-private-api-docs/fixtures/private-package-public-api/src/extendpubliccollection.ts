/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module private-package-public-api/extendpubliccollection
 * @publicApi
 */

import { PublicCollection } from '../../public-package/src/publiccollection.js';

export class ExtendPublicCollection extends PublicCollection {
	public isPrivate: boolean = true;
	private parent: PublicCollection | null = null;

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
 * @eventName ~ExtendPublicCollection#extendPublicCollectionEvent
 */
export type ExtendPublicCollectionEvent = {
	name: 'extendPublicCollectionEvent';
};
