/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'getWebpackConfigForManualTests()', () => {
	let getWebpackConfigForManualTests, stubs;

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
			logger: {},
			webpack: {
				DefinePlugin: sinon.stub(),
				ProvidePlugin: sinon.stub(),
				SourceMapDevToolPlugin: sinon.stub()
			},
			devTranslations: {
				CKEditorTranslationsPlugin: class {
					constructor( args ) {
						this.args = args;
					}
				}
			}
		};

		mockery.registerMock( 'webpack', stubs.webpack );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-translations', stubs.devTranslations );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			loaders: stubs.loaders,
			logger: () => stubs.logger
		} );

		getWebpackConfigForManualTests = require( '../../../lib/utils/manual-tests/getwebpackconfig' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should return webpack configuration object', () => {
		const entries = {
			'ckeditor5/tests/manual/all-features': '/home/ckeditor/ckeditor5/tests/manual/all-features.js'
		};

		const buildDir = '/home/ckeditor/ckeditor5/build/.manual-tests';

		const debug = [];

		const webpackConfig = getWebpackConfigForManualTests( {
			entries,
			buildDir,
			debug,
			themePath: '/theme/path',
			tsconfig: '/tsconfig/path'
		} );

		expect( stubs.loaders.getIconsLoader.calledOnce ).to.equal( true );
		expect( stubs.loaders.getIconsLoader.firstCall.args[ 0 ] ).to.have.property( 'matchExtensionOnly', true );

		expect( stubs.loaders.getStylesLoader.calledOnce ).to.equal( true );
		expect( stubs.loaders.getStylesLoader.firstCall.args[ 0 ] ).to.have.property( 'themePath', '/theme/path' );
		expect( stubs.loaders.getStylesLoader.firstCall.args[ 0 ] ).to.have.property( 'sourceMap', true );

		expect( stubs.loaders.getTypeScriptLoader.calledOnce ).to.equal( true );

		expect( stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ] ).to.have.property( 'debugFlags', debug );
		expect( stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ] ).to.have.property( 'configFile', '/tsconfig/path' );
		expect( stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ] ).to.have.property( 'includeDebugLoader', true );

		expect( stubs.loaders.getFormattedTextLoader.calledOnce ).to.equal( true );

		expect( stubs.loaders.getJavaScriptLoader.calledOnce ).to.equal( true );
		expect( stubs.loaders.getJavaScriptLoader.firstCall.args[ 0 ] ).to.have.property( 'debugFlags', debug );

		expect( stubs.loaders.getCoverageLoader.called ).to.equal( false );

		expect( webpackConfig ).to.be.an( 'object' );
		expect( webpackConfig.resolve.fallback.timers ).to.equal( false );

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

	it( 'pattern passed to CKEditorTranslationsPlugin should match paths to ckeditor5 packages', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( webpackConfig ).to.have.property( 'plugins' );
		expect( webpackConfig.plugins ).to.be.an( 'Array' );

		const CKEditorTranslationsPlugin = webpackConfig.plugins.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

		const pattern = CKEditorTranslationsPlugin.args.packageNamesPattern;

		expect( 'packages/ckeditor5-foo/bar'.match( pattern )[ 0 ] ).to.equal( 'packages/ckeditor5-foo/' );
	} );

	it( 'pattern passed to CKEditorTranslationsPlugin should match paths to external repositories named like ckeditor5 package', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( webpackConfig ).to.have.property( 'plugins' );
		expect( webpackConfig.plugins ).to.be.an( 'Array' );

		const CKEditorTranslationsPlugin = webpackConfig.plugins.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

		const pattern = CKEditorTranslationsPlugin.args.packageNamesPattern;

		expect( 'external/ckeditor5-foo/packages/ckeditor5-bar/baz'.match( pattern )[ 0 ] ).to.equal( 'packages/ckeditor5-bar/' );
	} );
} );
