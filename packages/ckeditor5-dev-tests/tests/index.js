/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as index from '../lib/index.js';
import runAutomatedTests from '../lib/tasks/runautomatedtests.js';
import runManualTests from '../lib/tasks/runmanualtests.js';
import parseArguments from '../lib/utils/automated-tests/parsearguments.js';

vi.mock( '../lib/tasks/runautomatedtests.js' );
vi.mock( '../lib/tasks/runmanualtests.js' );
vi.mock( '../lib/utils/automated-tests/parsearguments.js' );

describe( 'index.js', () => {
	describe( 'runAutomatedTests()', () => {
		it( 'should be a function', () => {
			expect( index.runAutomatedTests ).to.be.a( 'function' );
			expect( index.runAutomatedTests ).toEqual( runAutomatedTests );
		} );
	} );

	describe( 'runManualTests()', () => {
		it( 'should be a function', () => {
			expect( index.runManualTests ).to.be.a( 'function' );
			expect( index.runManualTests ).toEqual( runManualTests );
		} );
	} );

	describe( 'parseArguments()', () => {
		it( 'should be a function', () => {
			expect( index.parseArguments ).to.be.a( 'function' );
			expect( index.parseArguments ).toEqual( parseArguments );
		} );
	} );
} );
