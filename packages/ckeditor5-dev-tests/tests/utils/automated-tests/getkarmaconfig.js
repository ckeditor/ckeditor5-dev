/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'getKarmaConfig', () => {
	let getKarmaConfig, sandbox, stubs;
	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd' ).returns( 'workspace' );

		// Sinon cannot stub non-existing props.
		process.env = Object.assign( {}, originalEnv, { TRAVIS: false } );

		stubs = {
			fs: {
				writeFileSync: sandbox.stub()
			},
			glob: {
				sync: sandbox.stub()
			}
		};

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( './getwebpackconfig', options => options );

		getKarmaConfig = proxyquire( '../../../lib/utils/automated-tests/getkarmaconfig', {
			fs: stubs.fs,
			glob: stubs.glob
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();
		process.env = originalEnv;
	} );

	it( 'should return basic karma config for all tested files', () => {
		const allFiles = [
			'workspace/packages/ckeditor5-autoformat/tests/foo.js',
			'workspace/packages/ckeditor5-basic-styles/tests/bar.js',
			'workspace/packages/ckeditor5-engine/tests/foo/bar.js'
		];

		stubs.glob.sync.returns( allFiles );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'path/to/theme'
		} );

		expect( karmaConfig ).to.have.own.property( 'basePath', 'workspace' );
		expect( karmaConfig ).to.have.own.property( 'frameworks' );
		expect( karmaConfig ).to.have.own.property( 'files' );
		expect( karmaConfig ).to.have.own.property( 'preprocessors' );
		expect( karmaConfig ).to.have.own.property( 'webpack' );
		expect( karmaConfig.webpack.files ).to.deep.equal( [ 'workspace/packages/ckeditor5-*/tests/**/*.js' ] );
		expect( karmaConfig.webpack.sourceMap ).to.equal( false );
		expect( karmaConfig.webpack.coverage ).to.equal( false );
		expect( karmaConfig.webpack.themePath ).to.equal( 'path/to/theme' );
		expect( karmaConfig ).to.have.own.property( 'webpackMiddleware' );
		expect( karmaConfig ).to.have.own.property( 'reporters' );
		expect( karmaConfig ).to.have.own.property( 'browsers' );
		expect( karmaConfig ).to.have.own.property( 'singleRun', true );
	} );

	it( 'should return karma config with current package\'s tests', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '/' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/tests/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed given package files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ 'engine', 'utils' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/packages/ckeditor5-engine/tests/**/*.js',
			'workspace/packages/ckeditor5-utils/tests/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed excluded packages as files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '!engine' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/packages/ckeditor5-!(engine)*/tests/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed package directories as files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ 'engine/view' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/packages/ckeditor5-engine/tests/view/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed glob as files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ 'engine/model/**/*.js' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/packages/ckeditor5-engine/tests/model/**/*.js',
		] );
	} );

	it( 'should return karma config with coverage reporter', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ 'engine/model/**/*.js' ],
			reporter: 'mocha',
			coverage: true,
		} );

		expect( karmaConfig.reporters ).to.deep.eq( [ 'mocha', 'coverage' ] );
		expect( karmaConfig.coverageReporter ).to.deep.eq( {
			reporters: [
				{
					type: 'text-summary'
				},
				{
					dir: 'workspace/coverage',
					type: 'html'
				},
				{
					type: 'lcovonly',
					subdir: '.',
					dir: 'workspace/coverage'
				}
			]
		} );
	} );

	it( 'should return karma config for options.server=true', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '/' ],
			reporter: 'mocha',
			server: true
		} );

		expect( karmaConfig.browsers ).to.equal( null );
		expect( karmaConfig.autoWatch ).to.equal( true );
		expect( karmaConfig.singleRun ).to.equal( false );
	} );

	it( 'should return karma config for options.watch=true', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '/' ],
			reporter: 'mocha',
			watch: true,
			browsers: [ 'Chrome' ]
		} );

		expect( karmaConfig.browsers ).to.deep.equal( [ 'CHROME_LOCAL' ] );
		expect( karmaConfig.autoWatch ).to.equal( true );
		expect( karmaConfig.singleRun ).to.equal( false );
	} );

	it( 'should throw an error if no files are provided', () => {
		const spy = sandbox.spy( getKarmaConfig );

		try {
			spy( {
				reporter: 'mocha'
			} );
		} catch ( err ) {
			expect( err ).to.be.an.instanceof( Error );
		}

		expect( spy.threw() ).to.equal( true );
	} );
} );
