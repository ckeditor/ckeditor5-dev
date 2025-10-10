/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { resolveLoader } from '../../src/loaders/resolve-loader.js';

describe( 'resolveLoader()', () => {
	it( 'should be a function', () => {
		expect( resolveLoader ).to.be.a( 'function' );
	} );

	it( 'should resolve a loader path', () => {
		const loaderPath = resolveLoader( 'babel-loader' );

		expect( loaderPath ).to.be.a( 'string' );
		expect( loaderPath ).toEndWith( '/node_modules/babel-loader/lib/index.js' );
	} );
} );
