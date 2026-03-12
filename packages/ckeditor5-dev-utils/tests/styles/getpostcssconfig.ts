/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import postCssImport from 'postcss-import';
import postCssNesting from 'postcss-nesting';
import cssnano from 'cssnano';
import getPostCssConfig from '../../src/styles/getpostcssconfig.js';

vi.mock( 'postcss-import' );
vi.mock( 'postcss-nesting' );
vi.mock( 'cssnano' );

describe( 'getPostCssConfig()', () => {
	beforeEach( () => {
		vi.mocked( postCssImport ).mockReturnValue( 'postcss-import' as any );
		vi.mocked( postCssNesting ).mockReturnValue( 'postcss-nesting' as any );
		vi.mocked( cssnano ).mockReturnValue( 'cssnano' as any );
	} );

	it( 'returns PostCSS plugins', () => {
		expect( getPostCssConfig().plugins ).to.have.members( [
			'postcss-import',
			'postcss-nesting'
		] );
	} );

	// https://github.com/ckeditor/ckeditor5/issues/11730
	it( 'passes options to postcss-nesting', () => {
		getPostCssConfig();

		expect( vi.mocked( postCssNesting ) ).toHaveBeenCalledExactlyOnceWith( {
			noIsPseudoSelector: true,
			edition: '2021'
		} );
	} );

	it( 'supports #sourceMap option', () => {
		expect( getPostCssConfig( { sourceMap: true } ).sourceMap )
			.to.equal( 'inline' );
	} );

	it( 'supports #minify option', () => {
		expect( getPostCssConfig( { minify: true } ).plugins.pop() )
			.to.equal( 'cssnano' );
	} );
} );
