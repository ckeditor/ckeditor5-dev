/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Reflection, Serializer, JSONOutput } from 'typedoc';

type CKEditor5Event = JSONOutput.Reflection & {
	parameters: Array<JSONOutput.Reflection>;
};

type PartialObject = {
	[ key: string ]: unknown;
	ckeditor5Events: Array<CKEditor5Event>;
};

export default class EventTagSerializer {
	public get priority(): number {
		return 0;
	}

	public supports( item: Reflection ): boolean {
		return 'ckeditor5Events' in item;
	}

	public toObject( item: Reflection, obj: PartialObject, serializer: Serializer ): object {
		obj.ckeditor5Events = item.ckeditor5Events.map( internalItem => {
			const itemObj = internalItem.toObject( serializer ) as CKEditor5Event;

			itemObj.parameters = internalItem.parameters.map( internalParam => internalParam.toObject( serializer ) );

			return itemObj
		} );

		return obj;
	}
}
