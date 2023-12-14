/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const expect = chai.expect;

describe( 'builds/getDllPluginWebpackConfig()', () => {
	let sandbox, stubs, getDllPluginWebpackConfig;

	const manifest = {
		content: {
			'../../node_modules/lodash-es/_DataView.js': {
				id: '../../node_modules/lodash-es/_DataView.js',
				buildMeta: {
					buildMeta: 'namespace',
					providedExports: [
						'default'
					]
				}
			}
		}
	};

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		stubs = {
			tools: {
				readPackageName: sandbox.stub()
			},
			fs: {
				existsSync: sandbox.stub()
			},
			webpack: {
				BannerPlugin: sandbox.stub(),
				DllReferencePlugin: sandbox.stub()
			},
			loaders: {
				getIconsLoader: sinon.stub(),
				getStylesLoader: sinon.stub(),
				getTypeScriptLoader: sinon.stub()
			}
		};

		sandbox.stub( path, 'join' ).callsFake( ( ...args ) => args.join( '/' ) );

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( '../tools', stubs.tools );
		mockery.registerMock( '../loaders', stubs.loaders );
		mockery.registerMock( '/manifest/path', manifest );

		getDllPluginWebpackConfig = require( '../../lib/builds/getdllpluginwebpackconfig' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sandbox.restore();
	} );

	it( 'returns the webpack configuration in production mode by default', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig ).to.be.an( 'object' );

		expect( webpackConfig.mode ).to.equal( 'production' );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.ts' );
		expect( webpackConfig.output.library ).to.deep.equal( [ 'CKEditor5', 'dev' ] );
		expect( webpackConfig.output.path ).to.equal( '/package/path/build' );
		expect( webpackConfig.output.filename ).to.equal( 'dev.js' );
		expect( webpackConfig.plugins ).to.be.an( 'array' );

		expect( webpackConfig.optimization.minimize ).to.equal( true );
		expect( webpackConfig.optimization.minimizer ).to.be.an( 'array' );
		expect( webpackConfig.optimization.minimizer.length ).to.equal( 1 );

		// Due to versions mismatch, the `instanceof` check does not pass.
		expect( webpackConfig.optimization.minimizer[ 0 ].constructor.name ).to.equal( TerserPlugin.name );
	} );

	it( 'transforms package with many dashes in its name', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-html-embed' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig ).to.be.an( 'object' );
		expect( webpackConfig.output.library ).to.deep.equal( [ 'CKEditor5', 'htmlEmbed' ] );
		expect( webpackConfig.output.filename ).to.equal( 'html-embed.js' );
	} );

	it( 'does not minify the destination file when in dev mode', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path',
			isDevelopmentMode: true
		} );

		expect( webpackConfig.mode ).to.equal( 'development' );
		expect( webpackConfig.optimization.minimize ).to.equal( false );
		expect( webpackConfig.optimization.minimizer ).to.be.undefined;
	} );

	it( 'should not export any library by default', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.output.libraryExport ).to.be.undefined;
	} );

	it( 'uses index.ts entry file by default', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );
		stubs.fs.existsSync.callsFake( file => file == '/package/path/src/index.ts' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.ts' );
	} );

	it( 'uses index.js entry file if exists (over its TS version)', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );
		stubs.fs.existsSync.callsFake( file => file == '/package/path/src/index.js' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.js' );
	} );

	it( 'loads JavaScript files over TypeScript when building for a JavaScript package', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );
		stubs.fs.existsSync.callsFake( file => file == '/package/path/src/index.js' );

		const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.resolve.extensions[ 0 ] ).to.equal( '.js' );
	} );

	describe( '#plugins', () => {
		it( 'loads the webpack.DllReferencePlugin plugin', () => {
			stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

			const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			const dllReferencePlugin = webpackConfig.plugins.find( plugin => plugin instanceof stubs.webpack.DllReferencePlugin );

			expect( dllReferencePlugin ).to.be.an.instanceOf( stubs.webpack.DllReferencePlugin );
			expect( stubs.webpack.DllReferencePlugin.firstCall.args[ 0 ].manifest ).to.deep.equal( manifest );
			expect( stubs.webpack.DllReferencePlugin.firstCall.args[ 0 ].scope ).to.equal( 'ckeditor5/src' );
			expect( stubs.webpack.DllReferencePlugin.firstCall.args[ 0 ].name ).to.equal( 'CKEditor5.dll' );
			expect( stubs.webpack.DllReferencePlugin.firstCall.args[ 0 ].extensions ).to.be.undefined;
		} );

		it( 'loads the CKEditorTranslationsPlugin plugin when lang dir exists', () => {
			stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );
			stubs.fs.existsSync.returns( true );

			const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			// Due to versions mismatch, the `instanceof` check does not pass.
			const ckeditor5TranslationsPlugin = webpackConfig.plugins
				.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

			expect( ckeditor5TranslationsPlugin ).to.not.be.undefined;
			expect( ckeditor5TranslationsPlugin.options.language ).to.equal( 'en' );
			expect( ckeditor5TranslationsPlugin.options.additionalLanguages ).to.equal( 'all' );
			expect( ckeditor5TranslationsPlugin.options.skipPluralFormFunction ).to.equal( true );
			expect( 'src/bold.js' ).to.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'src/bold.ts' ).to.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.js' ).to.not.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.ts' ).to.not.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
		} );

		it( 'does not load the CKEditorTranslationsPlugin plugin when lang dir does not exist', () => {
			stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );
			stubs.fs.existsSync.returns( false );

			const webpackConfig = getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			// Due to versions mismatch, the `instanceof` check does not pass.
			const ckeditor5TranslationsPlugin = webpackConfig.plugins
				.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

			expect( ckeditor5TranslationsPlugin ).to.be.undefined;
		} );
	} );

	describe( '#loaders', () => {
		describe( 'getTypeScriptLoader()', () => {
			it( 'it should use the default tsconfig.json if the "options.tsconfigPath" option is not specified', () => {
				stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-html-embed' );

				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( stubs.loaders.getTypeScriptLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'configFile', 'tsconfig.json' );
			} );

			it( 'it should the specified "options.tsconfigPath" value', () => {
				stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-html-embed' );

				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path',
					tsconfigPath: '/config/tsconfig.json'
				} );

				expect( stubs.loaders.getTypeScriptLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'configFile', '/config/tsconfig.json' );
			} );
		} );

		describe( 'getIconsLoader()', () => {
			it( 'it should get the loader', () => {
				stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-html-embed' );

				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( stubs.loaders.getIconsLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getIconsLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'matchExtensionOnly', true );
			} );
		} );

		describe( 'getStylesLoader()', () => {
			it( 'it should get the loader', () => {
				stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-html-embed' );

				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( stubs.loaders.getStylesLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getStylesLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'minify', true );
				expect( options ).to.have.property( 'themePath', '/theme/path' );
			} );
		} );
	} );
} );
