/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';

describe( 'getCoverageLoader()', () => {
	it( 'should be a function', () => {
		expect( loaders.getCoverageLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition containing a loader for measuring the coverage', () => {

	} );
} );
