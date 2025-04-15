/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { DeclarationReflection } from 'typedoc';

declare module 'typedoc' {

	/**
	 * Extends a reflection with a property for describing an error definition.
	 */
	export interface Reflection {
		isCKEditor5Event: boolean;
		ckeditor5Events: Array<DeclarationReflection>;
	}
}
