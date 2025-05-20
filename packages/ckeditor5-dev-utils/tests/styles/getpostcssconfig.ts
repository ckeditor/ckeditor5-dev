/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import postCssImport from 'postcss-import';
import postCssMixins from 'postcss-mixins';
import postCssNesting from 'postcss-nesting';
import cssnano from 'cssnano';
import themeLogger from '../../src/styles/themelogger.js';
import themeImporter from '../../src/styles/themeimporter.js';
import getPostCssConfig from '../../src/styles/getpostcssconfig.js';

vi.mock( 'postcss-import' );
vi.mock( 'postcss-mixins' );
vi.mock( 'postcss-nesting' );
vi.mock( 'cssnano' );
vi.mock( '../../src/styles/themelogger.js' );
vi.mock( '../../src/styles/themeimporter.js' );

describe( 'getPostCssConfig()', () => {
	beforeEach( () => {
		vi.mocked( themeImporter ).mockReturnValue( 'postcss-ckeditor5-theme-importer' as any );
		vi.mocked( themeLogger ).mockReturnValue( 'postcss-ckeditor5-theme-logger' as any );
		vi.mocked( postCssImport ).mockReturnValue( 'postcss-import' as any );
		vi.mocked( postCssMixins ).mockReturnValue( 'postcss-mixins' as any );
		vi.mocked( postCssNesting ).mockReturnValue( 'postcss-nesting' as any );
		vi.mocked( cssnano ).mockReturnValue( 'cssnano' as any );
	} );

	it( 'returns PostCSS plugins', () => {
		expect( getPostCssConfig().plugins ).to.have.members( [
			'postcss-import',
			'postcss-ckeditor5-theme-importer',
			'postcss-mixins',
			'postcss-nesting',
			'postcss-ckeditor5-theme-logger'
		] );
	} );

	it( 'passes options to the theme importer', () => {
		getPostCssConfig( {
			themeImporter: {
				themePath: 'abc',
				debug: true
			}
		} );

		expect( vi.mocked( themeImporter ) ).toHaveBeenCalledExactlyOnceWith( {
			themePath: 'abc',
			debug: true
		} );
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
