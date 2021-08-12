/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const webpack = require( 'webpack' );
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
			}
		};

		sandbox.stub( path, 'join' ).callsFake( ( ...args ) => args.join( '/' ) );

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( '../tools', stubs.tools );
		mockery.registerMock( '/manifest/path', manifest );

		getDllPluginWebpackConfig = require( '../../lib/builds/getdllpluginwebpackconfig' );
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
	} );

	it( 'returns the webpack configuration in production mode by default', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

		const webpackConfig = getDllPluginWebpackConfig( {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig ).to.be.an( 'object' );

		expect( webpackConfig.mode ).to.equal( 'production' );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.js' );
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

		const webpackConfig = getDllPluginWebpackConfig( {
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

		const webpackConfig = getDllPluginWebpackConfig( {
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

		const webpackConfig = getDllPluginWebpackConfig( {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.output.libraryExport ).to.be.undefined;
	} );

	describe( '#plugins', () => {
		it( 'loads the webpack.DllReferencePlugin plugin', () => {
			stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

			const webpackConfig = getDllPluginWebpackConfig( {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			const dllReferencePlugin = webpackConfig.plugins.find( plugin => plugin instanceof webpack.DllReferencePlugin );

			expect( dllReferencePlugin ).to.be.an.instanceOf( webpack.DllReferencePlugin );
			expect( dllReferencePlugin.options.manifest ).to.deep.equal( manifest );
			expect( dllReferencePlugin.options.scope ).to.equal( 'ckeditor5/src' );
			expect( dllReferencePlugin.options.name ).to.equal( 'CKEditor5.dll' );
		} );

		it( 'loads the CKEditorWebpackPlugin plugin', () => {
			stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

			const webpackConfig = getDllPluginWebpackConfig( {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			// Due to versions mismatch, the `instanceof` check does not pass.
			const ckeditor5TranslationsPlugin = webpackConfig.plugins.find( plugin => plugin.constructor.name === 'CKEditorWebpackPlugin' );

			expect( ckeditor5TranslationsPlugin ).to.not.be.undefined;
			expect( ckeditor5TranslationsPlugin.options.language ).to.equal( 'en' );
			expect( ckeditor5TranslationsPlugin.options.additionalLanguages ).to.equal( 'all' );
			expect( ckeditor5TranslationsPlugin.options.skipPluralFormFunction ).to.equal( true );
			expect( 'src/bold.js' ).to.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.js' ).to.not.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
		} );
	} );
} );
