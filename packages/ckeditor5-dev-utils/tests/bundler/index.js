/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as bundler from '../../lib/bundler/index.js';
import getLicenseBanner from '../../lib/bundler/getlicensebanner.js';

vi.mock( '../../lib/bundler/getlicensebanner.js' );

describe( 'bundler/index.js', () => {
	describe( 'getLicenseBanner()', () => {
		it( 'should be a function', () => {
			expect( bundler.getLicenseBanner ).to.be.a( 'function' );
			expect( bundler.getLicenseBanner ).toEqual( getLicenseBanner );
		} );
	} );
} );
