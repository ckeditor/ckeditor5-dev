/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as styles from '../../src/styles/index.js';
import getLightningCssConfig from '../../src/styles/getlightningcssconfig.js';

vi.mock( '../../src/styles/getlightningcssconfig.js' );

describe( 'styles/index.js', () => {
	describe( 'getLightningCssConfig()', () => {
		it( 'should be a function', () => {
			expect( styles.getLightningCssConfig ).to.be.a( 'function' );
			expect( styles.getLightningCssConfig ).toEqual( getLightningCssConfig );
		} );
	} );
} );
