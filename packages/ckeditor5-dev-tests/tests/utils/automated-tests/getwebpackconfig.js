/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'getWebpackConfigForAutomatedTests()', () => {
	let getWebpackConfigForAutomatedTests, stubs;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			getDefinitionsFromFile: sinon.stub().returns( {} ),
			loaders: {
				getIconsLoader: sinon.stub().returns( {} ),
				getStylesLoader: sinon.stub().returns( {} ),
				getTypeScriptLoader: sinon.stub().returns( {} ),
				getFormattedTextLoader: sinon.stub().returns( {} ),
				getCoverageLoader: sinon.stub().returns( {} ),
				getJavaScriptLoader: sinon.stub().returns( {} )
			},
			TreatWarningsAsErrorsWebpackPlugin: class TreatWarningsAsErrorsWebpackPlugin {}
		};

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', { loaders: stubs.loaders } );

		mockery.registerMock( '../getdefinitionsfromfile', stubs.getDefinitionsFromFile );

		mockery.registerMock( './treatwarningsaserrorswebpackplugin', stubs.TreatWarningsAsErrorsWebpackPlugin );

		getWebpackConfigForAutomatedTests = require( '../../../lib/utils/automated-tests/getwebpackconfig' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should return basic webpack configuration object', () => {
		const debug = [];
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			debug,
			themePath: '/theme/path',
			tsconfig: '/tsconfig/path'
		} );

		expect( webpackConfig.resolve.extensions ).to.deep.equal( [ '.ts', '.js', '.json' ] );
		expect( webpackConfig.resolve.fallback.timers ).to.equal( false );

		expect( stubs.loaders.getIconsLoader.calledOnce ).to.equal( true );

		expect( stubs.loaders.getStylesLoader.calledOnce ).to.equal( true );
		expect( stubs.loaders.getStylesLoader.firstCall.args[ 0 ] ).to.have.property( 'themePath', '/theme/path' );
		expect( stubs.loaders.getStylesLoader.firstCall.args[ 0 ] ).to.have.property( 'minify', true );

		expect( stubs.loaders.getTypeScriptLoader.calledOnce ).to.equal( true );
		expect( stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ] ).to.have.property( 'configFile', '/tsconfig/path' );

		expect( stubs.loaders.getFormattedTextLoader.calledOnce ).to.equal( true );

		expect( stubs.loaders.getCoverageLoader.called ).to.equal( false );

		expect( webpackConfig.resolveLoader.modules[ 0 ] ).to.equal( 'node_modules' );
		expect( webpackConfig.devtool ).to.equal( undefined );
		expect( webpackConfig.output ).to.have.property( 'devtoolModuleFilenameTemplate' );
	} );

	it( 'should aggregate events when running with the enabled watch mode', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		expect( webpackConfig ).to.have.property( 'watchOptions' );
		expect( webpackConfig.watchOptions ).to.have.property( 'aggregateTimeout', 500 );
	} );

	it( 'should not include the ck-debug-loader', () => {
		getWebpackConfigForAutomatedTests( {
			files: [ '**/*.js' ]
		} );
		expect( stubs.loaders.getJavaScriptLoader.called ).to.equal( false );
	} );

	it( 'should return webpack configuration containing a loader for measuring the coverage', () => {
		getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [ '**/*.js' ]
		} );

		expect( stubs.loaders.getCoverageLoader.called ).to.equal( true );
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

	it( 'should return webpack configuration with loaded identity file', () => {
		stubs.getDefinitionsFromFile.returns( { LICENSE_KEY: 'secret' } );

		const webpackConfig = getWebpackConfigForAutomatedTests( {
			identityFile: 'path/to/secrets.js'
		} );

		const plugin = webpackConfig.plugins[ 0 ];

		expect( stubs.getDefinitionsFromFile.firstCall.args[ 0 ] ).to.equal( 'path/to/secrets.js' );
		expect( plugin.definitions.LICENSE_KEY ).to.equal( 'secret' );
	} );

	it( 'should return webpack configuration with correct extension resolve order', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			resolveJsFirst: true
		} );

		expect( webpackConfig.resolve.extensions ).to.deep.equal( [ '.js', '.ts', '.json' ] );
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

	it( 'should add TreatWarningsAsErrorsWebpackPlugin to plugins if options.production is true', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			production: true
		} );

		expect( webpackConfig.plugins.filter( plugin => plugin instanceof stubs.TreatWarningsAsErrorsWebpackPlugin ) )
			.to.have.lengthOf( 1 );
	} );
} );
