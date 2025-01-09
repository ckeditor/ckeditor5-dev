/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as stream from '../../lib/stream/index.js';
import noop from '../../lib/stream/noop.js';

vi.mock( '../../lib/stream/noop.js' );

describe( 'stream/index.js', () => {
	describe( 'noop()', () => {
		it( 'should be a function', () => {
			expect( stream.noop ).to.be.a( 'function' );
			expect( stream.noop ).toEqual( noop );
		} );
	} );
} );
