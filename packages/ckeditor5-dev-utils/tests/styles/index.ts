/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as styles from '../../src/styles/index.js';
import getPostCssConfig from '../../src/styles/getpostcssconfig.js';

vi.mock( '../../src/styles/getpostcssconfig.js' );
vi.mock( '../../src/styles/themeimporter.js' );

describe( 'styles/index.js', () => {
	describe( 'getPostCssConfig()', () => {
		it( 'should be a function', () => {
			expect( styles.getPostCssConfig ).to.be.a( 'function' );
			expect( styles.getPostCssConfig ).toEqual( getPostCssConfig );
		} );
	} );
} );
