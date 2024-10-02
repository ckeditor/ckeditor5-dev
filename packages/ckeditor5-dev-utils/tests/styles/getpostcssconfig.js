/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import postCssImport from 'postcss-import';
import postCssMixins from 'postcss-mixins';
import postCssNesting from 'postcss-nesting';
import cssnano from 'cssnano';
import themeLogger from '../../lib/styles/themelogger.js';
import themeImporter from '../../lib/styles/themeimporter.js';
import getPostCssConfig from '../../lib/styles/getpostcssconfig.js';

vi.mock( 'postcss-import' );
vi.mock( 'postcss-mixins' );
vi.mock( 'postcss-nesting' );
vi.mock( 'cssnano' );
vi.mock( '../../lib/styles/themelogger.js' );
vi.mock( '../../lib/styles/themeimporter.js' );

describe( 'getPostCssConfig()', () => {
	beforeEach( () => {
		vi.mocked( themeImporter ).mockReturnValue( 'postcss-ckeditor5-theme-importer' );
		vi.mocked( themeLogger ).mockReturnValue( 'postcss-ckeditor5-theme-logger' );
		vi.mocked( postCssImport ).mockReturnValue( 'postcss-import' );
		vi.mocked( postCssMixins ).mockReturnValue( 'postcss-mixins' );
		vi.mocked( postCssNesting ).mockReturnValue( 'postcss-nesting' );
		vi.mocked( cssnano ).mockReturnValue( 'cssnano' );
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
