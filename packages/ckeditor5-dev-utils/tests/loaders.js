/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const loaders = require( '../lib/loaders' );
// const escapedPathSep = require( 'path' ).sep === '/' ? '/' : '\\\\';

describe( 'loaders', () => {
	describe( 'getTypeScriptLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getTypeScriptLoader ).to.be.a( 'function' );
		} );

		// it.skip( 'should process TypeScript files properly', () => {
		// 	const webpackConfig = getWebpackConfigForAutomatedTests( {
		// 		tsconfig: '/home/project/configs/tsconfig.json'
		// 	} );
		//
		// 	const tsRule = webpackConfig.module.rules.find( rule => {
		// 		return rule.test.toString().endsWith( '/\\.ts$/' );
		// 	} );
		//
		// 	if ( !tsRule ) {
		// 		throw new Error( 'A loader for ".ts" files was not found.' );
		// 	}
		//
		// 	const tsLoader = tsRule.use.find( item => item.loader === 'esbuild-loader' );
		//
		// 	if ( !tsLoader ) {
		// 		throw new Error( '"esbuild-loader" missing' );
		// 	}
		//
		// 	expect( tsLoader ).to.have.property( 'options' );
		// 	expect( tsLoader.options ).to.have.property( 'target', 'es2019' );
		// 	expect( tsLoader.options ).to.have.property( 'tsconfig', '/home/project/configs/tsconfig.json' );
		// } );

		// it( 'should use the debug loader before the typescript loader while loading TS files', () => {
		// 	const webpackConfig = getWebpackConfigForManualTests( {} );
		//
		// 	const tsRule = webpackConfig.module.rules.find( rule => {
		// 		return rule.test.toString().endsWith( '/\\.ts$/' );
		// 	} );
		//
		// 	if ( !tsRule ) {
		// 		throw new Error( 'A loader for ".ts" files was not found.' );
		// 	}
		//
		// 	const ckDebugLoaderIndex = tsRule.use.findIndex( item => item.loader.endsWith( 'ck-debug-loader.js' ) );
		// 	const tsLoaderIndex = tsRule.use.findIndex( item => item.loader === 'esbuild-loader' );
		//
		// 	if ( ckDebugLoaderIndex === undefined ) {
		// 		throw new Error( '"ck-debug-loader" missing' );
		// 	}
		//
		// 	if ( tsLoaderIndex === undefined ) {
		// 		throw new Error( '"esbuild-loader" missing' );
		// 	}
		//
		// 	// Webpack reads the "use" array from back to the front.
		// 	expect( ckDebugLoaderIndex ).to.equal( 1 );
		// 	expect( tsLoaderIndex ).to.equal( 0 );
		// } );
	} );

	describe( 'getJavaScriptLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getJavaScriptLoader ).to.be.a( 'function' );
		} );
	} );

	describe( 'getStylesLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getStylesLoader ).to.be.a( 'function' );
		} );

		// it.skip( 'should return webpack configuration with the correct setup of the postcss-loader', () => {
		// 	getWebpackConfigForAutomatedTests( {
		// 		themePath: 'path/to/theme'
		// 	} );
		//
		// 	expect( postCssOptions ).to.deep.equal( {
		// 		themeImporter: {
		// 			themePath: 'path/to/theme'
		// 		},
		// 		minify: true
		// 	} );
		// } );
	} );

	describe( 'getIconsLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getIconsLoader ).to.be.a( 'function' );
		} );

		// it.skip( 'should load svg files properly', () => {
		// 	const webpackConfig = getWebpackConfigForAutomatedTests( {} );
		// 	const svgRule = webpackConfig.module.rules.find( rule => {
		// 		return rule.test.toString().endsWith( '.svg$/' );
		// 	} );
		//
		// 	if ( !svgRule ) {
		// 		throw new Error( 'Not found loader for "svg".' );
		// 	}
		//
		// 	const svgRegExp = svgRule.test;
		//
		// 	expect( 'C:\\Program Files\\ckeditor\\ckeditor5-basic-styles\\theme\\icons\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		// 	expect( '/home/ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg' ).to.match( svgRegExp, 'Linux' );
		// } );
	} );

	describe( 'getFormattedTextLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getFormattedTextLoader ).to.be.a( 'function' );
		} );
	} );

	describe( 'getCoverageLoader()', () => {
		it( 'should be a function', () => {
			expect( loaders.getCoverageLoader ).to.be.a( 'function' );
		} );

		// it.skip( 'should return webpack configuration containing a loader for measuring the coverage (include check)', () => {
		// 	const webpackConfig = getWebpackConfigForAutomatedTests( {
		// 		coverage: true,
		// 		files: [
		// 			[
		// 				'node_modules/ckeditor5-utils/tests/**/*.js'
		// 			]
		// 		]
		// 	} );
		//
		// 	const coverageLoader = webpackConfig.module.rules[ 0 ];
		//
		// 	expect( coverageLoader ).to.not.equal( undefined );
		//
		// 	expect( coverageLoader.include ).to.be.an( 'array' );
		// 	expect( coverageLoader.include ).to.deep.equal( [
		// 		new RegExp( [ 'ckeditor5-utils', 'src', '' ].join( escapedPathSep ) )
		// 	] );
		// } );
		//
		// it.skip( 'should return webpack configuration containing a loader for measuring the coverage (exclude check)', () => {
		// 	const webpackConfig = getWebpackConfigForAutomatedTests( {
		// 		coverage: true,
		// 		files: [
		// 			[
		// 				'node_modules/ckeditor5-!(utils)/tests/**/*.js'
		// 			]
		// 		]
		// 	} );
		//
		// 	const coverageLoader = webpackConfig.module.rules[ 0 ];
		//
		// 	expect( coverageLoader ).to.not.equal( undefined );
		//
		// 	expect( coverageLoader.include ).to.be.an( 'array' );
		// 	expect( coverageLoader.include ).to.deep.equal( [
		// 		new RegExp( [ 'ckeditor5-!(utils)', 'src', '' ].join( escapedPathSep ) )
		// 	] );
		// } );
	} );
} );

