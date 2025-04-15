/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Reflection } from 'typedoc';
import { getTarget } from './gettarget.js';

/**
 * Checks if the name (identifier) that is provided for a tag, points to an existing reflection in the whole project.
 * The identifier can be either a relative or an absolute one.
 */
export function isIdentifierValid( reflection: Reflection, identifier: string ): boolean {
	// We don't want to validate inherited identifiers, because they should be checked only once in the base class.
	// Inherited reflections could contain identifiers (links) that are valid only in the base class and not in the derived class.
	if ( 'inheritedFrom' in reflection ) {
		return true;
	}

	return !!getTarget( reflection, identifier );
}
