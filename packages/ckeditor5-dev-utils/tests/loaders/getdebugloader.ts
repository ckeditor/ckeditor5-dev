/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import getDebugLoader from '../../src/loaders/getdebugloader.js';

describe( 'getDebugLoader()', () => {
	it( 'should be a function', () => {
		expect( getDebugLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition containing a loader for measuring the coverage', () => {
		const loader = getDebugLoader( [ 'CK_DEBUG_ENGINE' ] );

		expect( loader ).toEqual( {
			loader: expect.stringMatching( /ck-debug-loader\.js$/ ),
			options: {
				debugFlags: [ 'CK_DEBUG_ENGINE' ]
			}
		} );
	} );
} );
