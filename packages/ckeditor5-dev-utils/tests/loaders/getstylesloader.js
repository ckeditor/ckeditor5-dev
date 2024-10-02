/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getStylesLoader from '../../lib/loaders/getstylesloader.js';
import { getPostCssConfig } from '../../lib/styles/index.js';

vi.mock( 'mini-css-extract-plugin', () => ( {
	default: class {
		static get loader() {
			return '/path/to/mini-css-extract-plugin/loader';
		}
	}
} ) );
vi.mock( '../../lib/styles/index.js' );

describe( 'getStylesLoader()', () => {
	it( 'should be a function', () => {
		expect( getStylesLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition that allow saving the produced CSS into a file using `mini-css-extract-plugin#loader`', () => {
		const loader = getStylesLoader( {
			extractToSeparateFile: true,
			themePath: 'path/to/theme'
		} );

		expect( loader ).to.be.an( 'object' );

		const cssLoader = loader.use.at( 0 );

		expect( cssLoader ).to.be.equal( '/path/to/mini-css-extract-plugin/loader' );
	} );

	it( 'should return a definition that allow attaching the produced CSS on a site using `style-loader`', () => {
		const loader = getStylesLoader( {
			themePath: 'path/to/theme'
		} );

		expect( loader ).to.be.an( 'object' );

		const styleLoader = loader.use[ 0 ];

		expect( styleLoader ).to.be.an( 'object' );
		expect( styleLoader ).to.have.property( 'loader', 'style-loader' );
		expect( styleLoader ).to.have.property( 'options' );
		expect( styleLoader.options ).to.be.an( 'object' );
		expect( styleLoader.options ).to.have.property( 'injectType', 'singletonStyleTag' );
		expect( styleLoader.options ).to.have.property( 'attributes' );
	} );

	it( 'should return a definition containing the correct setup of the `postcss-loader`', () => {
		vi.mocked( getPostCssConfig ).mockReturnValue( 'styles.getPostCssConfig()' );

		const loader = getStylesLoader( {
			themePath: 'path/to/theme'
		} );

		expect( loader ).to.be.an( 'object' );

		const postCssLoader = loader.use.at( -1 );

		expect( postCssLoader ).to.be.an( 'object' );
		expect( postCssLoader ).to.have.property( 'loader', 'postcss-loader' );
		expect( postCssLoader ).to.have.property( 'options' );
		expect( postCssLoader.options ).to.be.an( 'object' );
		expect( postCssLoader.options ).to.have.property( 'postcssOptions', 'styles.getPostCssConfig()' );

		expect( vi.mocked( getPostCssConfig ) ).toHaveBeenCalledExactlyOnceWith( {
			minify: false,
			sourceMap: false,
			themeImporter: {
				themePath: 'path/to/theme'
			}
		} );
	} );

	it( 'should return a definition containing the correct setup of the `css-loader`', () => {
		const loader = getStylesLoader( {
			skipPostCssLoader: true
		} );

		for ( const definition of loader.use ) {
			expect( definition.loader ).to.not.equal( 'postcss-loader' );
		}
	} );

	it( 'should allow skipping adding the postcss-loader', () => {
		const loader = getStylesLoader( {
			skipPostCssLoader: true
		} );

		const cssLoader = loader.use.at( -1 );

		expect( cssLoader ).to.be.equal( 'css-loader' );
	} );
} );
