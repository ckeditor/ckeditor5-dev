/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as styles from '../../src/styles/index.js';
import getPostCssConfig from '../../src/styles/getpostcssconfig.js';
import themeImporter from '../../src/styles/themeimporter.js';

vi.mock( '../../src/styles/getpostcssconfig.js' );
vi.mock( '../../src/styles/themeimporter.js' );

describe( 'styles/index.js', () => {
	describe( 'getPostCssConfig()', () => {
		it( 'should be a function', () => {
			expect( styles.getPostCssConfig ).to.be.a( 'function' );
			expect( styles.getPostCssConfig ).toEqual( getPostCssConfig );
		} );
	} );

	describe( 'themeImporter()', () => {
		it( 'should be a function', () => {
			expect( styles.themeImporter ).to.be.a( 'function' );
			expect( styles.themeImporter ).toEqual( themeImporter );
		} );
	} );
} );
