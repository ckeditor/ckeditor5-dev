/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as tools from '../../lib/tools/index.js';
import shExec from '../../lib/tools/shexec.js';
import createSpinner from '../../lib/tools/createspinner.js';
import getDirectories from '../../lib/tools/getdirectories.js';
import updateJSONFile from '../../lib/tools/updatejsonfile.js';

vi.mock( '../../lib/tools/shexec.js' );
vi.mock( '../../lib/tools/createspinner.js' );
vi.mock( '../../lib/tools/getdirectories.js' );
vi.mock( '../../lib/tools/updatejsonfile.js' );

describe( 'tools/index.js', () => {
	describe( 'createSpinner()', () => {
		it( 'should be a function', () => {
			expect( tools.createSpinner ).to.be.a( 'function' );
			expect( tools.createSpinner ).toEqual( createSpinner );
		} );
	} );

	describe( 'getDirectories()', () => {
		it( 'should be a function', () => {
			expect( tools.getDirectories ).to.be.a( 'function' );
			expect( tools.getDirectories ).toEqual( getDirectories );
		} );
	} );

	describe( 'shExec()', () => {
		it( 'should be a function', () => {
			expect( tools.shExec ).to.be.a( 'function' );
			expect( tools.shExec ).toEqual( shExec );
		} );
	} );

	describe( 'updateJSONFile()', () => {
		it( 'should be a function', () => {
			expect( tools.updateJSONFile ).to.be.a( 'function' );
			expect( tools.updateJSONFile ).toEqual( updateJSONFile );
		} );
	} );
} );
