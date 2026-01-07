/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as tools from '../../src/tools/index.js';
import shExec from '../../src/tools/shexec.js';
import createSpinner from '../../src/tools/createspinner.js';
import getDirectories from '../../src/tools/getdirectories.js';
import updateJSONFile from '../../src/tools/updatejsonfile.js';
import commit from '../../src/tools/commit.js';

vi.mock( '../../src/tools/shexec.js' );
vi.mock( '../../src/tools/createspinner.js' );
vi.mock( '../../src/tools/getdirectories.js' );
vi.mock( '../../src/tools/updatejsonfile.js' );
vi.mock( '../../src/tools/commit.js' );

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

	describe( 'commit()', () => {
		it( 'should be a function', () => {
			expect( tools.commit ).to.be.a( 'function' );
			expect( tools.commit ).toEqual( commit );
		} );
	} );
} );
