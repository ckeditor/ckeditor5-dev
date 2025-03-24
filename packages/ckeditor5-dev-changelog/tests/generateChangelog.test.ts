/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelog } from '../src/index.js';
import { test, expect } from 'vitest';

test( 'returns the expected string', () => {
	expect( generateChangelog() ).toEqual( 'Hello from ckeditor5-dev-changelog!' );
} );
