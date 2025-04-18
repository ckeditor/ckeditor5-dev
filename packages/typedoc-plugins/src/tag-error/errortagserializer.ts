/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Reflection, Serializer } from 'typedoc';

type PartialObject = {
	[ key: string ]: unknown;
	isCKEditor5Error?: boolean;
};

export default class ErrorTagSerializer {
	public get priority(): number {
		return 0;
	}

	public supports( item: Reflection ): boolean {
		return 'isCKEditor5Error' in item;
	}

	public toObject( item: Reflection, obj: PartialObject, serializer: Serializer ): object {
		obj.isCKEditor5Error = item.isCKEditor5Error;
		obj.parameters = item.parameters.map( item => item.toObject( serializer ) );

		return obj;
	}
}
