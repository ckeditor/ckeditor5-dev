/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { DeclarationReflection } from 'typedoc';

export default class CleanUpSerializer {
	public get priority(): number {
		return 0;
	}

	public supports(): boolean {
		return true;
	}

	public toObject( item: DeclarationReflection, obj: Partial<DeclarationReflection> ): object {
		delete obj.groups;

		return obj;
	}
}
