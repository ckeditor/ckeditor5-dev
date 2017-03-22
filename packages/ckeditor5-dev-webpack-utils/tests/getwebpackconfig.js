/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const BabiliPlugin = require( 'babili-webpack-plugin' );

describe( 'dev-bundler-webpack/utils', () => {
	let getWebpackConfig, sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		getWebpackConfig = require( '../lib/getwebpackconfig' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'getWebpackConfig()', () => {
		it( 'returns configuration for webpack which compiles code to ES5', () => {
			sandbox.spy( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

			const cwd = '/cwd';
			const entryPoint = cwd + '/ckeditor.js';
			const destinationPath = cwd + '/build';

			const config = getWebpackConfig( {
				cwd,
				entryPoint,
				destinationPath
			} );

			expect( config ).to.have.property( 'devtool', 'cheap-source-map' );
			expect( config ).to.have.property( 'entry' );

			expect( config.entry ).to.be.a( 'array' );
			expect( config.entry[ 0 ] ).to.match( /regenerator-runtime\/runtime\.js$/ );
			expect( config.entry[ 1 ] ).to.equal( entryPoint );

			expect( config ).to.have.property( 'output' );
			expect( config.output ).to.have.property( 'path', destinationPath );
			expect( config.output ).to.have.property( 'filename', 'ckeditor.js' );
			expect( config.output ).to.have.property( 'libraryTarget', 'umd' );

			expect( config ).to.have.deep.property( 'plugins' );
			expect( config.plugins ).to.be.an( 'array' );
			expect( config.plugins[ 0 ] ).to.be.instanceof( BabiliPlugin );

			expect( config ).to.have.deep.property( 'module' );
			expect( config.module ).to.have.property( 'rules' );
			expect( config.module.rules ).to.be.an( 'array' );
			expect( config.module.rules.length ).to.equal( 3 );

			expect( config ).to.have.deep.property( 'resolveLoader' );
			expect( config.resolveLoader ).to.have.property( 'modules' );
			expect( config.resolveLoader.modules[ 0 ] ).to.equal( cwd + '/node_modules' );
		} );
	} );
} );
