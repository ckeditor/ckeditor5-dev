/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import * as index from '../lib/index.js';
import { toEqualMarkup } from '../lib/vitest/matchers.js';

describe( 'index.js', () => {
	describe( 'toEqualMarkup()', () => {
		it( 'should be re-exported', () => {
			expect( index.toEqualMarkup ).toEqual( toEqualMarkup );
		} );
	} );
} );
