/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import * as index from '../lib/index.js';
import { markupMatchers, toEqualMarkup } from '../lib/vitest/matchers.js';

describe( 'index.js', () => {
	describe( 'markupMatchers', () => {
		it( 'should be re-exported', () => {
			expect( index.markupMatchers ).toEqual( markupMatchers );
			expect( index.toEqualMarkup ).toEqual( toEqualMarkup );
		} );
	} );
} );
