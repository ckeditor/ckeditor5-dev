/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getLicenseBanner from '../../src/bundler/getlicensebanner.js';

describe( 'getLicenseBanner()', () => {
	it( 'should return a banner', () => {
		expect( getLicenseBanner() ).to.match( /\/\*![\S\s]+\*\//g );
	} );
} );
