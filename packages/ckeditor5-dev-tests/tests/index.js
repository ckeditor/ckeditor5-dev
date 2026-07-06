/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as index from '../lib/index.js';
import runAutomatedTests from '../lib/tasks/runautomatedtests.js';
import runManualTests from '../lib/tasks/runmanualtests.js';
import { markupMatchers, toEqualMarkup } from '../lib/vitest/matchers.js';

vi.mock( '../lib/tasks/runautomatedtests.js' );
vi.mock( '../lib/tasks/runmanualtests.js' );

describe( 'index.js', () => {
	describe( 'runAutomatedTests()', () => {
		it( 'should delegate to the task module', async () => {
			const options = { files: [ 'engine' ] };

			await index.runAutomatedTests( options );

			expect( vi.mocked( runAutomatedTests ) ).toHaveBeenCalledExactlyOnceWith( options );
		} );
	} );

	describe( 'runManualTests()', () => {
		it( 'should delegate to the task module', async () => {
			const options = { files: [ 'engine' ] };

			await index.runManualTests( options );

			expect( vi.mocked( runManualTests ) ).toHaveBeenCalledExactlyOnceWith( options );
		} );
	} );

	describe( 'markupMatchers', () => {
		it( 'should be re-exported', () => {
			expect( index.markupMatchers ).toEqual( markupMatchers );
			expect( index.toEqualMarkup ).toEqual( toEqualMarkup );
		} );
	} );
} );
