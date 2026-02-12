/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import getStylesLoader from '../../src/loaders/getstylesloader.js';
import { getPostCssConfig } from '../../src/styles/index.js';

vi.mock( 'mini-css-extract-plugin', () => ( {
	default: class {
		public static get loader() {
			return '/path/to/mini-css-extract-plugin/loader';
		}
	}
} ) );
vi.mock( '../../src/styles/index.js' );

describe( 'getStylesLoader()', () => {
	it( 'should be a function', () => {
		expect( getStylesLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition that allow saving the produced CSS into a file using `mini-css-extract-plugin#loader`', () => {
		const loader = getStylesLoader( {
			extractToSeparateFile: true } );

		expect( loader ).to.be.an( 'object' );

		const cssLoader = loader.use.at( 0 );

		expect( cssLoader ).to.be.equal( '/path/to/mini-css-extract-plugin/loader' );
	} );

	it( 'should return a definition that allow attaching the produced CSS on a site using `style-loader`', () => {
		const loader = getStylesLoader( {} );

		expect( loader ).to.be.an( 'object' );

		const styleLoader = loader.use[ 0 ];

		expect( styleLoader ).to.be.an( 'object' );
		expect( ( styleLoader as any ).loader ).to.include( 'style-loader' );
		expect( styleLoader ).to.have.property( 'options' );

		const options = typeof styleLoader === 'object' && styleLoader.options;

		expect( options ).to.be.an( 'object' );
		expect( options ).to.have.property( 'injectType', 'singletonStyleTag' );
		expect( options ).to.have.property( 'attributes' );
	} );

	it( 'should return a definition containing the correct setup of the `postcss-loader`', () => {
		vi.mocked( getPostCssConfig ).mockReturnValue( 'styles.getPostCssConfig()' as any );

		const loader = getStylesLoader( {} );

		expect( loader ).to.be.an( 'object' );

		const postCssLoader = loader.use.at( -1 );

		expect( postCssLoader ).to.be.an( 'object' );
		expect( ( postCssLoader as any ).loader ).to.include( 'postcss-loader' );
		expect( postCssLoader ).to.have.property( 'options' );

		const options = typeof postCssLoader === 'object' && postCssLoader.options;

		expect( options ).to.be.an( 'object' );
		expect( options ).to.have.property( 'postcssOptions', 'styles.getPostCssConfig()' );

		expect( vi.mocked( getPostCssConfig ) ).toHaveBeenCalledExactlyOnceWith( {
			minify: false,
			sourceMap: false
		} );
	} );

	it( 'should return a definition containing the correct setup of the `css-loader`', () => {
		const loader = getStylesLoader( {
			skipPostCssLoader: true
		} as any );

		for ( const definition of loader.use ) {
			expect( typeof definition === 'object' ? definition.loader : definition ).to.not.include( 'postcss-loader' );
		}
	} );

	it( 'should allow skipping adding the postcss-loader', () => {
		const loader = getStylesLoader( {
			skipPostCssLoader: true
		} as any );

		const cssLoader = loader.use.at( -1 );

		expect( cssLoader ).to.include( 'css-loader' );
	} );
} );
