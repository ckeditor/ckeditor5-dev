/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const mockery = require( 'mockery' );
const sinon = require( 'sinon' );

const escapedPathSep = require( 'path' ).sep === '/' ? '/' : '\\\\';

describe( 'loaders', () => {
	let loaders, postCssOptions;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'mini-css-extract-plugin', {
			loader: '/path/to/mini-css-extract-plugin/loader'
		} );

		mockery.registerMock( '../styles', {
			getPostCssConfig: options => {
				postCssOptions = options;

				return 'styles.getPostCssConfig()';
			}
		} );

		loaders = require( '../../lib/loaders/index' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	describe( 'getTypeScriptLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getTypeScriptLoader ).to.be.a( 'function' );
		} );

		it( 'should return a definition that allows processing `*.ts` files using esbuild-loader', () => {
			const tsLoader = loaders.getTypeScriptLoader( {
				configFile: '/home/project/configs/tsconfig.json'
			} );

			expect( tsLoader ).to.be.an( 'object' );
			expect( tsLoader ).to.have.property( 'test' );

			expect( 'C:\\Program Files\\ckeditor\\plugin.ts' ).to.match( tsLoader.test, 'Windows' );
			expect( '/home/ckeditor/plugin.ts' ).to.match( tsLoader.test, 'Linux' );

			const esbuildLoader = tsLoader.use.find( item => item.loader === 'esbuild-loader' );

			expect( esbuildLoader ).to.be.an( 'object' );
			expect( esbuildLoader ).to.have.property( 'options' );
			expect( esbuildLoader.options ).to.have.property( 'tsconfig', '/home/project/configs/tsconfig.json' );
		} );

		it( 'should return a definition that allows processing `*.ts` files using esbuild-loader (skipping `options.configFile`)', () => {
			const tsLoader = loaders.getTypeScriptLoader();

			expect( tsLoader ).to.be.an( 'object' );
			expect( tsLoader ).to.have.property( 'test' );

			expect( 'C:\\Program Files\\ckeditor\\plugin.ts' ).to.match( tsLoader.test, 'Windows' );
			expect( '/home/ckeditor/plugin.ts' ).to.match( tsLoader.test, 'Linux' );

			const esbuildLoader = tsLoader.use.find( item => item.loader === 'esbuild-loader' );

			expect( esbuildLoader ).to.be.an( 'object' );
			expect( esbuildLoader ).to.have.property( 'options' );
			expect( esbuildLoader.options ).to.have.property( 'tsconfig', 'tsconfig.json' );
		} );

		it( 'should return a definition that enables the debug loader before the typescript files', () => {
			const tsLoader = loaders.getTypeScriptLoader( {
				configFile: '/home/project/configs/tsconfig.json',
				includeDebugLoader: true,
				debugFlags: [ 'ENGINE' ]
			} );

			const ckDebugLoaderIndex = tsLoader.use.findIndex( item => item.loader.endsWith( 'ck-debug-loader' ) );
			const tsLoaderIndex = tsLoader.use.findIndex( item => item.loader === 'esbuild-loader' );

			// Webpack reads the "use" array from back to the front.
			expect( ckDebugLoaderIndex ).to.equal( 1 );
			expect( tsLoaderIndex ).to.equal( 0 );
		} );

		it( 'should pass the debug options into the debug loader', () => {
			const tsLoader = loaders.getTypeScriptLoader( {
				configFile: '/home/project/configs/tsconfig.json',
				includeDebugLoader: true,
				debugFlags: [ 'ENGINE' ]
			} );

			const debugLoader = tsLoader.use.find( item => item.loader.endsWith( 'ck-debug-loader' ) );

			expect( debugLoader ).to.be.an( 'object' );
			expect( debugLoader ).to.have.property( 'loader' );
			expect( debugLoader ).to.have.property( 'options' );
			expect( debugLoader.options ).to.be.an( 'object' );
			expect( debugLoader.options ).to.have.property( 'debugFlags' );
			expect( debugLoader.options.debugFlags ).to.be.an( 'array' );
			expect( debugLoader.options.debugFlags ).to.include( 'ENGINE' );
		} );
	} );

	describe( 'getJavaScriptLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getJavaScriptLoader ).to.be.a( 'function' );
		} );

		it( 'should return a definition that enables the ck-debug-loader', () => {
			const debugLoader = loaders.getJavaScriptLoader( {
				debugFlags: [ 'ENGINE' ]
			} );

			expect( debugLoader ).to.be.an( 'object' );
			expect( debugLoader ).to.have.property( 'test' );

			expect( 'C:\\Program Files\\ckeditor\\plugin.js' ).to.match( debugLoader.test, 'Windows' );
			expect( '/home/ckeditor/plugin.js' ).to.match( debugLoader.test, 'Linux' );

			expect( debugLoader ).to.have.property( 'loader' );
			expect( debugLoader.loader.endsWith( 'ck-debug-loader' ) ).to.equal( true );
			expect( debugLoader ).to.have.property( 'options' );
			expect( debugLoader.options ).to.be.an( 'object' );
			expect( debugLoader.options ).to.have.property( 'debugFlags' );
			expect( debugLoader.options.debugFlags ).to.be.an( 'array' );
			expect( debugLoader.options.debugFlags ).to.include( 'ENGINE' );
		} );
	} );

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

	describe( 'getIconsLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getIconsLoader ).to.be.a( 'function' );
		} );

		it( 'should return a definition loading the svg files properly (a full CKEditor 5 icon path check)', () => {
			const svgLoader = loaders.getIconsLoader();

			expect( svgLoader ).to.be.an( 'object' );
			expect( svgLoader ).to.have.property( 'use' );
			expect( svgLoader.use ).to.include( 'raw-loader' );
			expect( svgLoader ).to.have.property( 'test' );

			const svgRegExp = svgLoader.test;

			expect( 'C:\\Program Files\\ckeditor\\ckeditor5-basic-styles\\theme\\icons\\italic.svg' ).to.match( svgRegExp, 'Windows' );
			expect( '/home/ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg' ).to.match( svgRegExp, 'Linux' );
		} );

		it( 'should return a definition loading the svg files properly (accept any svg file)', () => {
			const svgLoader = loaders.getIconsLoader( { matchExtensionOnly: true } );

			expect( svgLoader ).to.be.an( 'object' );
			expect( svgLoader ).to.have.property( 'use' );
			expect( svgLoader.use ).to.include( 'raw-loader' );
			expect( svgLoader ).to.have.property( 'test' );

			const svgRegExp = svgLoader.test;

			expect( 'C:\\Program Files\\ckeditor\\italic.svg' ).to.match( svgRegExp, 'Windows' );
			expect( '/home/ckeditor/italic.svg' ).to.match( svgRegExp, 'Linux' );
		} );
	} );

	describe( 'getFormattedTextLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getFormattedTextLoader ).to.be.a( 'function' );
		} );

		it( 'should return a definition accepting files that store readable content', () => {
			const textLoader = loaders.getFormattedTextLoader();

			expect( textLoader ).to.be.an( 'object' );
			expect( textLoader ).to.have.property( 'use' );
			expect( textLoader.use ).to.include( 'raw-loader' );
			expect( textLoader ).to.have.property( 'test' );

			const loaderRegExp = textLoader.test;

			expect( 'C:\\Program Files\\ckeditor\\italic.html' ).to.match( loaderRegExp, 'HTML: Windows' );
			expect( '/home/ckeditor/italic.html' ).to.match( loaderRegExp, 'HTML: Linux' );

			expect( 'C:\\Program Files\\ckeditor\\italic.txt' ).to.match( loaderRegExp, 'TXT: Windows' );
			expect( '/home/ckeditor/italic.txt' ).to.match( loaderRegExp, 'TXT: Linux' );

			expect( 'C:\\Program Files\\ckeditor\\italic.rtf' ).to.match( loaderRegExp, 'RTF: Windows' );
			expect( '/home/ckeditor/italic.rtf' ).to.match( loaderRegExp, 'RTF: Linux' );
		} );
	} );

	describe( 'getCoverageLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getCoverageLoader ).to.be.a( 'function' );
		} );

		it( 'should return a definition containing a loader for measuring the coverage', () => {
			const coverageLoader = loaders.getCoverageLoader( {
				files: []
			} );

			expect( coverageLoader ).to.be.an( 'object' );
			expect( '/path/to/javascript.js' ).to.match( coverageLoader.test );
			expect( '/path/to/typescript.ts' ).to.match( coverageLoader.test );

			expect( coverageLoader.include ).to.be.an( 'array' );
			expect( coverageLoader.include ).to.lengthOf( 0 );
			expect( coverageLoader.exclude ).to.be.an( 'array' );
			expect( coverageLoader.exclude ).to.lengthOf( 1 );

			expect( coverageLoader.use ).to.be.an( 'array' );
			expect( coverageLoader.use ).to.lengthOf( 1 );

			const babelLoader = coverageLoader.use[ 0 ];

			expect( babelLoader.loader ).to.equal( 'babel-loader' );
		} );

		it( 'should return a definition containing a loader for measuring the coverage (include glob check)', () => {
			const coverageLoader = loaders.getCoverageLoader( {
				files: [
					// -f utils
					[ 'node_modules/ckeditor5-utils/tests/**/*.js' ]
				]
			} );

			expect( coverageLoader ).to.be.an( 'object' );
			expect( coverageLoader ).to.have.property( 'include' );
			expect( coverageLoader.include ).to.be.an( 'array' );
			expect( coverageLoader.include ).to.deep.equal( [
				new RegExp( [ 'ckeditor5-utils', 'src', '' ].join( escapedPathSep ) )
			] );
		} );

		it( 'should return a definition containing a loader for measuring the coverage (exclude glob check)', () => {
			const coverageLoader = loaders.getCoverageLoader( {
				files: [
					// -f !utils
					[ 'node_modules/ckeditor5-!(utils)/tests/**/*.js' ]
				]
			} );

			expect( coverageLoader ).to.be.an( 'object' );
			expect( coverageLoader ).to.have.property( 'include' );
			expect( coverageLoader.include ).to.be.an( 'array' );
			expect( coverageLoader.include ).to.deep.equal( [
				new RegExp( [ 'ckeditor5-!(utils)', 'src', '' ].join( escapedPathSep ) )
			] );
		} );

		it( 'should return a definition containing a loader for measuring the coverage (for root named ckeditor5-*)', () => {
			const coverageLoader = loaders.getCoverageLoader( {
				files: [
					[ '/ckeditor5-collab/packages/ckeditor5-alignment/tests/**/*.{js,ts}' ]
				]
			} );

			expect( coverageLoader ).to.be.an( 'object' );
			expect( coverageLoader ).to.have.property( 'include' );
			expect( coverageLoader.include ).to.be.an( 'array' );
			expect( coverageLoader.include ).to.deep.equal( [
				new RegExp( [ 'ckeditor5-alignment', 'src', '' ].join( escapedPathSep ) )
			] );
		} );
	} );
} );

