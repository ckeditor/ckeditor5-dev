/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';


describe( 'getStylesLoader()', () => {
	it( 'should be a function', () => {
		expect( loaders.getStylesLoader ).to.be.a( 'function' );
	} );

	it( 'should return a definition that allow saving the produced CSS into a file using `mini-css-extract-plugin#loader`', () => {
		const loader = loaders.getStylesLoader( {
			extractToSeparateFile: true,
			themePath: 'path/to/theme'
		} );

		expect( loader ).to.be.an( 'object' );

		const cssLoader = loader.use[ 0 ];

		expect( cssLoader ).to.be.equal( '/path/to/mini-css-extract-plugin/loader' );
	} );

	it( 'should return a definition that allow attaching the produced CSS on a site using `style-loader`', () => {
		const loader = loaders.getStylesLoader( {
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
		const loader = loaders.getStylesLoader( {
			themePath: 'path/to/theme'
		} );

		expect( loader ).to.be.an( 'object' );

		// Array.at() is available since Node 16.6.
		const postCssLoader = loader.use.pop();

		expect( postCssLoader ).to.be.an( 'object' );
		expect( postCssLoader ).to.have.property( 'loader', 'postcss-loader' );
		expect( postCssLoader ).to.have.property( 'options' );
		expect( postCssLoader.options ).to.be.an( 'object' );
		expect( postCssLoader.options ).to.have.property( 'postcssOptions', 'styles.getPostCssConfig()' );

		expect( postCssOptions ).to.be.an( 'object' );
		expect( postCssOptions ).to.have.property( 'themeImporter' );
		expect( postCssOptions ).to.have.property( 'minify', false );
		expect( postCssOptions ).to.have.property( 'sourceMap', false );
		expect( postCssOptions.themeImporter ).to.be.an( 'object' );
		expect( postCssOptions.themeImporter ).to.have.property( 'themePath', 'path/to/theme' );
	} );

	it( 'should return a definition containing the correct setup of the `css-loader`', () => {
		const loader = loaders.getStylesLoader( {
			skipPostCssLoader: true
		} );

		for ( const definition of loader.use ) {
			expect( definition.loader ).to.not.equal( 'postcss-loader' );
		}
	} );

	it( 'should allow skipping adding the postcss-loader', () => {
		const loader = loaders.getStylesLoader( {
			skipPostCssLoader: true
		} );

		// Array.at() is available since Node 16.6.
		const cssLoader = loader.use.pop();

		expect( cssLoader ).to.be.equal( 'css-loader' );
	} );
} );
