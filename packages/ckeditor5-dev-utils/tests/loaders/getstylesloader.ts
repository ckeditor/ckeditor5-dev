/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import { Features } from 'lightningcss';
import getStylesLoader from '../../src/loaders/getstylesloader.js';

vi.mock( 'mini-css-extract-plugin', () => ( {
	default: class {
		public static get loader() {
			return '/path/to/mini-css-extract-plugin/loader';
		}
	}
} ) );

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

	it( 'should return a definition containing the correct setup of the `ck-lightningcss-loader`', () => {
		const loader = getStylesLoader( {} );

		expect( loader ).to.be.an( 'object' );

		const lightningCssLoader = loader.use.at( -1 );

		expect( lightningCssLoader ).to.be.an( 'object' );
		expect( ( lightningCssLoader as any ).loader ).to.match( /ck-lightningcss-loader\.js$/ );
		expect( lightningCssLoader ).to.have.property( 'options' );

		const options = typeof lightningCssLoader === 'object' && lightningCssLoader.options;

		expect( options ).to.be.an( 'object' );
		expect( options ).to.have.property( 'lightningCssOptions' ).that.deep.equals( {
			minify: false,
			sourceMap: false,
			include: Features.Nesting
		} );
	} );

	it( 'should return a definition containing the correct setup of the `css-loader`', () => {
		const loader = getStylesLoader( {} );

		const cssLoader = loader.use[ 1 ];

		expect( cssLoader ).to.be.an( 'object' );
		expect( ( cssLoader as any ).loader ).to.include( 'css-loader' );
		expect( cssLoader ).to.have.property( 'options' );

		const options = typeof cssLoader === 'object' && cssLoader.options;

		expect( options ).to.be.an( 'object' );
		expect( options ).to.have.property( 'importLoaders', 1 );
		expect( options ).to.have.property( 'sourceMap', false );
	} );
} );
