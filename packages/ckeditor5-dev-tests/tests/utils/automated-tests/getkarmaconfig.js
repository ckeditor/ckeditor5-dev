/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'getKarmaConfig()', () => {
	let getKarmaConfig, sandbox;
	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		sandbox.stub( process, 'cwd' ).returns( 'workspace' );
		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		// Sinon cannot stub non-existing props.
		process.env = Object.assign( {}, originalEnv, { TRAVIS: false } );

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( './getwebpackconfig', options => options );

		getKarmaConfig = require( '../../../lib/utils/automated-tests/getkarmaconfig' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();

		process.env = originalEnv;
	} );

	it( 'should return basic karma config for all tested files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig ).to.have.own.property( 'basePath', 'workspace' );
		expect( karmaConfig ).to.have.own.property( 'frameworks' );
		expect( karmaConfig ).to.have.own.property( 'files' );
		expect( karmaConfig ).to.have.own.property( 'preprocessors' );
		expect( karmaConfig ).to.have.own.property( 'webpack' );
		expect( karmaConfig.webpack.files ).to.deep.equal( [ 'workspace/packages/ckeditor5-*/tests/**/*.js' ] );
		expect( karmaConfig.webpack.sourceMap ).to.equal( false );
		expect( karmaConfig.webpack.coverage ).to.equal( false );
		expect( karmaConfig.webpack.themePath ).to.equal( 'workspace/path/to/theme.css' );
		expect( karmaConfig ).to.have.own.property( 'webpackMiddleware' );
		expect( karmaConfig ).to.have.own.property( 'reporters' );
		expect( karmaConfig ).to.have.own.property( 'browsers' );
		expect( karmaConfig ).to.have.own.property( 'singleRun', true );
	} );

	it( 'should define proxies to static assets resources', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig ).to.have.own.property( 'proxies' );
		expect( karmaConfig.proxies ).to.have.own.property( '/assets/' );

		expect( karmaConfig.files ).to.be.an( 'array' );
		expect( karmaConfig.files.length ).to.equal( 2 );
		expect( karmaConfig.files[ 0 ] ).to.equal( 'workspace/entry-file.js' );
		expect( karmaConfig.files[ 1 ].pattern ).to.equal( 'packages/ckeditor5-utils/tests/_assets/**/*' );
	} );

	// See: https://github.com/ckeditor/ckeditor5/issues/8823
	it( 'should define proxies to static assets resources', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig ).to.have.own.property( 'proxies' );
		expect( karmaConfig.proxies ).to.have.own.property( '/example.com/image.png' );
		expect( karmaConfig.proxies ).to.have.own.property( '/www.example.com/image.png' );
	} );

	it( 'should contain a list of available plugins', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig.plugins ).to.be.an( 'array' );
		expect( karmaConfig.plugins ).to.have.lengthOf.above( 0 );
	} );
} );
