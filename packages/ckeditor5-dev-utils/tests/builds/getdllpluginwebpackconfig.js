/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const webpack = require( 'webpack' );
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

	it( 'returns the webpack configuration', () => {
		stubs.tools.readPackageName.returns( '@ckeditor/ckeditor5-dev' );

		const webpackConfig = getDllPluginWebpackConfig( {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig ).to.be.an( 'object' );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.js' );
		expect( webpackConfig.output.library ).to.deep.equal( [ 'CKEditor5', 'dev' ] );
		expect( webpackConfig.output.path ).to.equal( '/package/path/build' );
		expect( webpackConfig.output.filename ).to.equal( 'dev.js' );

		expect( webpackConfig.plugins ).to.be.an( 'array' );
		expect( webpackConfig.plugins[ 1 ] ).to.be.an.instanceOf( webpack.DllReferencePlugin );

		expect( webpackConfig.plugins[ 1 ].options.manifest ).to.deep.equal( manifest );
		expect( webpackConfig.plugins[ 1 ].options.scope ).to.equal( 'ckeditor5/src' );
		expect( webpackConfig.plugins[ 1 ].options.name ).to.equal( 'CKEditor5.dll' );
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
} );
