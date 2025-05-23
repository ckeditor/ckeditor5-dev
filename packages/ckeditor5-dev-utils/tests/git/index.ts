/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as git from '../../src/git/index.js';
import commit from '../../src/git/commit.js';

vi.mock( '../../src/git/commit.js' );

describe( 'git/index.js', () => {
	describe( 'commit()', () => {
		it( 'should be a function', () => {
			expect( git.commit ).to.be.a( 'function' );
			expect( git.commit ).toEqual( commit );
		} );
	} );
} );
