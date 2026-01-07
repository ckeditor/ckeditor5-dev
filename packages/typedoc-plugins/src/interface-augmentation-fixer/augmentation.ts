/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { DeclarationReflection } from 'typedoc';

declare module 'typedoc' {

	/**
	 * Extends a project reflection with a property for storing augmented interfaces.
	 */
	export interface ProjectReflection {
		ckeditor5AugmentedInterfaces?: Array<DeclarationReflection>;
	}
}
