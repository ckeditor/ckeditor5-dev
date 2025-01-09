/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import * as loaders from '../../lib/loaders/index.js';
import getCoverageLoader from '../../lib/loaders/getcoverageloader.js';
import getTypeScriptLoader from '../../lib/loaders/gettypescriptloader.js';
import getDebugLoader from '../../lib/loaders/getdebugloader.js';
import getIconsLoader from '../../lib/loaders/geticonsloader.js';
import getFormattedTextLoader from '../../lib/loaders/getformattedtextloader.js';
import getJavaScriptLoader from '../../lib/loaders/getjavascriptloader.js';
import getStylesLoader from '../../lib/loaders/getstylesloader.js';

vi.mock( '../../lib/loaders/getcoverageloader.js' );
vi.mock( '../../lib/loaders/gettypescriptloader.js' );
vi.mock( '../../lib/loaders/getdebugloader.js' );
vi.mock( '../../lib/loaders/geticonsloader.js' );
vi.mock( '../../lib/loaders/getformattedtextloader.js' );
vi.mock( '../../lib/loaders/getjavascriptloader.js' );
vi.mock( '../../lib/loaders/getstylesloader.js' );

describe( 'loaders/index.js', () => {
	describe( 'getCoverageLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getCoverageLoader ).to.be.a( 'function' );
			expect( loaders.getCoverageLoader ).toEqual( getCoverageLoader );
		} );
	} );

	describe( 'getTypeScriptLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getTypeScriptLoader ).to.be.a( 'function' );
			expect( loaders.getTypeScriptLoader ).toEqual( getTypeScriptLoader );
		} );
	} );

	describe( 'getDebugLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getDebugLoader ).to.be.a( 'function' );
			expect( loaders.getDebugLoader ).toEqual( getDebugLoader );
		} );
	} );

	describe( 'getIconsLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getIconsLoader ).to.be.a( 'function' );
			expect( loaders.getIconsLoader ).toEqual( getIconsLoader );
		} );
	} );

	describe( 'getFormattedTextLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getFormattedTextLoader ).to.be.a( 'function' );
			expect( loaders.getFormattedTextLoader ).toEqual( getFormattedTextLoader );
		} );
	} );

	describe( 'getJavaScriptLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getJavaScriptLoader ).to.be.a( 'function' );
			expect( loaders.getJavaScriptLoader ).toEqual( getJavaScriptLoader );
		} );
	} );

	describe( 'getStylesLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getStylesLoader ).to.be.a( 'function' );
			expect( loaders.getStylesLoader ).toEqual( getStylesLoader );
		} );
	} );
} );

