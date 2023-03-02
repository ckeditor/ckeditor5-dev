/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );

describe( 'getWebpackConfigForManualTests()', () => {
	let getWebpackConfigForManualTests;

	beforeEach( () => {
		getWebpackConfigForManualTests = require( '../../../lib/utils/manual-tests/getwebpackconfig' );
	} );

	it( 'should return webpack configuration object', () => {
		const entries = {
			'ckeditor5/tests/manual/all-features': '/home/ckeditor/ckeditor5/tests/manual/all-features.js'
		};

		const buildDir = '/home/ckeditor/ckeditor5/build/.manual-tests';

		const webpackConfig = getWebpackConfigForManualTests( {
			entries, buildDir
		} );

		expect( webpackConfig ).to.be.an( 'object' );

		expect( webpackConfig.resolve ).to.deep.equal( {
			extensions: [ '.ts', '.js', '.json' ]
		} );

		// To avoid "eval()" in files.
		expect( webpackConfig ).to.have.property( 'mode', 'none' );
		expect( webpackConfig ).to.have.property( 'entry', entries );
		expect( webpackConfig ).to.have.property( 'output' );
		expect( webpackConfig.output ).to.deep.equal( { path: buildDir } );
		expect( webpackConfig ).to.have.property( 'plugins' );
		expect( webpackConfig ).to.have.property( 'watch', true );

		// The `devtool` property has been replaced by the `SourceMapDevToolPlugin()`.
		expect( webpackConfig ).to.not.have.property( 'devtool' );
	} );

	it( 'should disable watcher mechanism when passing the "disableWatch" option', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( webpackConfig ).to.be.an( 'object' );
		expect( webpackConfig ).to.not.have.property( 'devtool' );
		expect( webpackConfig ).to.not.have.property( 'watch' );
	} );

	it( 'should process TypeScript files properly', () => {
		const webpackConfig = getWebpackConfigForManualTests( {
			tsconfig: '/home/project/configs/tsconfig.json'
		} );

		const tsRule = webpackConfig.module.rules.find( rule => {
			return rule.test.toString().endsWith( '/\\.ts$/' );
		} );

		if ( !tsRule ) {
			throw new Error( 'A loader for ".ts" files was not found.' );
		}

		const ckDebugLoader = tsRule.use.find( item => item.loader.endsWith( 'ck-debug-loader.js' ) );
		const tsLoader = tsRule.use.find( item => item.loader === 'ts-loader' );

		if ( !ckDebugLoader ) {
			throw new Error( '"ck-debug-loader" missing' );
		}

		if ( !tsLoader ) {
			throw new Error( '"ts-loader" missing' );
		}

		expect( tsLoader ).to.have.property( 'options' );
		expect( tsLoader.options ).to.have.property( 'compilerOptions' );
		expect( tsLoader.options.compilerOptions ).to.deep.equal( {
			noEmit: false,
			noEmitOnError: false
		} );
		expect( tsLoader.options ).to.have.property( 'configFile' );
		expect( tsLoader.options.configFile ).to.equal( '/home/project/configs/tsconfig.json' );
	} );

	it( 'should use "ck-debug-loader" before "ts-loader" while loading TS files', () => {
		const webpackConfig = getWebpackConfigForManualTests( {} );

		const tsRule = webpackConfig.module.rules.find( rule => {
			return rule.test.toString().endsWith( '/\\.ts$/' );
		} );

		if ( !tsRule ) {
			throw new Error( 'A loader for ".ts" files was not found.' );
		}

		const ckDebugLoaderIndex = tsRule.use.findIndex( item => item.loader.endsWith( 'ck-debug-loader.js' ) );
		const tsLoaderIndex = tsRule.use.findIndex( item => item.loader === 'ts-loader' );

		if ( ckDebugLoaderIndex === undefined ) {
			throw new Error( '"ck-debug-loader" missing' );
		}

		if ( tsLoaderIndex === undefined ) {
			throw new Error( '"ts-loader" missing' );
		}

		// Webpack reads the "use" array from back to the front.
		expect( ckDebugLoaderIndex ).to.equal( 1 );
		expect( tsLoaderIndex ).to.equal( 0 );
	} );
} );
