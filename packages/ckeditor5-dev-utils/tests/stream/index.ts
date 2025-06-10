/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as stream from '../../src/stream/index.js';
import noop from '../../src/stream/noop.js';

vi.mock( '../../src/stream/noop.js' );

describe( 'stream/index.js', () => {
	describe( 'noop()', () => {
		it( 'should be a function', () => {
			expect( stream.noop ).to.be.a( 'function' );
			expect( stream.noop ).toEqual( noop );
		} );
	} );
} );
