/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Reflection } from 'typedoc';

/**
 * Checks if the reflection can be considered as "valid" (supported). Only reflections that are not nested inside a type are supported.
 */
export function isReflectionValid( reflection: Reflection ): boolean {
	if ( reflection.name === '__type' ) {
		return false;
	}

	if ( reflection.parent ) {
		return isReflectionValid( reflection.parent );
	}

	return true;
}
