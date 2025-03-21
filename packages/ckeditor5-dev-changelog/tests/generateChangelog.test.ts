/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generatechangelog } from '../src/index.js';
import { test, expect } from 'vitest';

test( 'returns the expected string', () => {
	expect( generatechangelog() ).toEqual( 'Hello from ckeditor5-dev-changelog!' );
} );
