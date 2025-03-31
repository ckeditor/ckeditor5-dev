/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { TransformScope } from '../types.js';
import { NPM_URL } from '../constants.js';

/**
 * Default transform scope.
 */
export const defaultTransformScope: TransformScope = name => ( {
	displayName: name,
	npmUrl: `${ NPM_URL }/${ name }`
} );
