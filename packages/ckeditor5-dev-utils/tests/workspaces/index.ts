/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as workspaces from '../../src/workspaces/index.js';
import findPathsToPackages from '../../src/workspaces/findpathstopackages.js';

vi.mock( '../../src/workspaces/findpathstopackages.js' );

describe( 'workspaces/index.js', () => {
	describe( 'findPathsToPackages()', () => {
		it( 'should be a function', () => {
			expect( workspaces.findPathsToPackages ).to.be.a( 'function' );
			expect( workspaces.findPathsToPackages ).toEqual( findPathsToPackages );
		} );
	} );
} );
