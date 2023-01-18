/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'getWebpackConfigForAutomatedTests()', () => {
	const escapedPathSep = require( 'path' ).sep === '/' ? '/' : '\\\\';
	let getWebpackConfigForAutomatedTests, getDefinitionsFromFile, postCssOptions;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			styles: {
				getPostCssConfig: options => {
					postCssOptions = options;
				}
			}
		} );

		getDefinitionsFromFile = sinon.stub().returns( {} );

		mockery.registerMock( '../getdefinitionsfromfile', getDefinitionsFromFile );

		getWebpackConfigForAutomatedTests = require( '../../../lib/utils/automated-tests/getwebpackconfig' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should return basic webpack configuration object', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		expect( webpackConfig.resolve ).to.deep.equal( {
			extensions: [ '.ts', '.js', '.json' ]
		} );

		expect( webpackConfig.module.rules.length ).to.equal( 5 );
		expect( webpackConfig.resolveLoader.modules[ 0 ] ).to.equal( 'node_modules' );

		expect( webpackConfig.devtool ).to.equal( undefined );
		expect( webpackConfig.output ).to.have.property( 'devtoolModuleFilenameTemplate' );
		expect( webpackConfig ).to.have.property( 'watchOptions' );
		expect( webpackConfig.watchOptions ).to.have.property( 'aggregateTimeout', 500 );
	} );

	it( 'should return webpack configuration with istanbul loader', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [ '**/*.js' ]
		} );

		const istanbulLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'istanbul-instrumenter-loader' );

		expect( istanbulLoader ).to.deep.equal( {
			test: /\.[jt]s$/,
			loader: 'istanbul-instrumenter-loader',
			include: [],
			exclude: [
				new RegExp( `${ escapedPathSep }(lib)${ escapedPathSep }` )
			],
			options: {
				esModules: true
			}
		} );
	} );

	it( 'should return webpack configuration with istanbul loader containing include regexp', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [
				[
					'node_modules/ckeditor5-utils/tests/**/*.js'
				]
			]
		} );

		const istanbulLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'istanbul-instrumenter-loader' );

		expect( istanbulLoader.include ).to.deep.equal( [
			new RegExp( [ 'ckeditor5-utils', 'src', '' ].join( escapedPathSep ) )
		] );
	} );

	it( 'should return webpack configuration with istanbul loader containing include regexp (exclude pattern)', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [
				[
					'node_modules/ckeditor5-!(utils)/tests/**/*.js'
				]
			]
		} );

		const istanbulLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'istanbul-instrumenter-loader' );

		expect( istanbulLoader.include ).to.deep.equal( [
			new RegExp( [ 'ckeditor5-!(utils)', 'src', '' ].join( escapedPathSep ) )
		] );
	} );

	it( 'should return webpack configuration with source map support', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			sourceMap: true
		} );

		expect( webpackConfig.devtool ).to.equal( 'inline-source-map' );
		expect( webpackConfig.optimization ).to.deep.equal( {
			runtimeChunk: false,
			splitChunks: false
		} );
	} );

	it( 'should contain a correct paths in resolveLoader', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		const firstPath = webpackConfig.resolveLoader.modules[ 0 ];
		const secondPath = webpackConfig.resolveLoader.modules[ 1 ];

		expect( firstPath ).to.equal( 'node_modules' );

		expect( secondPath ).to.match( /node_modules$/ );
		expect( require( 'fs' ).existsSync( secondPath ) ).to.equal( true );
	} );

	it( 'should return webpack configuration with the correct setup of the postcss-loader', () => {
		getWebpackConfigForAutomatedTests( {
			themePath: 'path/to/theme'
		} );

		expect( postCssOptions ).to.deep.equal( {
			themeImporter: {
				themePath: 'path/to/theme'
			},
			minify: true
		} );
	} );

	it( 'should load svg files properly', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );
		const svgRule = webpackConfig.module.rules.find( rule => {
			return rule.test.toString().endsWith( '.svg$/' );
		} );

		if ( !svgRule ) {
			throw new Error( 'Not found loader for "svg".' );
		}

		const svgRegExp = svgRule.test;

		expect( 'C:\\Program Files\\ckeditor\\ckeditor5-basic-styles\\theme\\icons\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		expect( '/home/ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg' ).to.match( svgRegExp, 'Linux' );
	} );

	it( 'should return webpack configuration with loaded identity file', () => {
		getDefinitionsFromFile.returns( { LICENSE_KEY: 'secret' } );

		const webpackConfig = getWebpackConfigForAutomatedTests( {
			identityFile: 'path/to/secrets.js'
		} );

		const plugin = webpackConfig.plugins[ 0 ];

		expect( getDefinitionsFromFile.firstCall.args[ 0 ] ).to.equal( 'path/to/secrets.js' );
		expect( plugin.definitions.LICENSE_KEY ).to.equal( 'secret' );
	} );

	it( 'should process TypeScript files properly', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		const tsRule = webpackConfig.module.rules.find( rule => {
			return rule.test.toString().endsWith( '/\\.ts$/' );
		} );

		if ( !tsRule ) {
			throw new Error( 'A loader for ".ts" files was not found.' );
		}

		expect( tsRule.use[ 0 ].loader.endsWith( 'ck-debug-loader.js' ) ).to.be.true;
		expect( tsRule.use[ 1 ] ).to.be.an( 'object' );
		expect( tsRule.use[ 1 ] ).to.have.property( 'loader', 'ts-loader' );
		expect( tsRule.use[ 1 ] ).to.have.property( 'options' );
		expect( tsRule.use[ 1 ].options ).to.have.property( 'compilerOptions' );
		expect( tsRule.use[ 1 ].options.compilerOptions ).to.deep.equal( {
			noEmit: false,
			noEmitOnError: true
		} );
	} );

	it( 'should return webpack configuration with correct extension resolve order', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			resolveJsFirst: true
		} );

		expect( webpackConfig.resolve ).to.deep.equal( {
			extensions: [ '.js', '.ts', '.json' ]
		} );
	} );

	it( 'should return webpack configuration with cache enabled', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			cache: true
		} );

		expect( webpackConfig.cache ).to.deep.equal( {
			type: 'filesystem'
		} );
	} );

	it( 'should get rid of the "webpack://" protocol to make the paths clickable in the terminal', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		const { devtoolModuleFilenameTemplate } = webpackConfig.output;

		const info = { resourcePath: 'foo/bar/baz' };

		expect( devtoolModuleFilenameTemplate( info ) ).to.equal( info.resourcePath );
	} );
} );
