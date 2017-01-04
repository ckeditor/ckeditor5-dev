/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'getkarmaconfig', () => {
	let getKarmaConfig;
	let sandbox;
	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd', () => 'workspace' );

		// sinon cannot stub non-existing props.
		process.env = Object.assign( {}, originalEnv, { TRAVIS: false } );
		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );
		mockery.registerMock( './getwebpackconfigforautomatedtests', ( options ) => options );

		getKarmaConfig = require( '../../lib/utils/getkarmaconfig' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		process.env = originalEnv;
	} );

	it( 'should return basic karma config for all tested files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: 'Chrome',
			watch: false,
			verbose: false
		} );

		const expectedFile = 'workspace/node_modules/ckeditor5-!(dev)*/tests/**/*.js';

		expect( karmaConfig ).to.deep.eq( {
			basePath: 'workspace',
			frameworks: [ 'mocha', 'chai', 'sinon' ],
			files: [ expectedFile ],
			exclude: [
				path.join( '**', 'tests', '**', '_utils', '**', '*.js' ),
				path.join( '**', 'tests', '**', 'manual', '**', '*.js' )
			],
			preprocessors: {
				[ expectedFile ]: [ 'webpack' ]
			},
			webpack: {
				files: [ expectedFile ],
				sourceMap: false,
				coverage: false,
			},
			webpackMiddleware: {
				noInfo: true,
				stats: {
					chunks: false
				}
			},
			reporters: [ 'mocha' ],
			port: 9876,
			colors: true,
			logLevel: 'INFO',
			browsers: 'Chrome',
			customLaunchers: {
				CHROME_TRAVIS_CI: {
					base: 'Chrome',
					flags: [ '--no-sandbox' ]
				}
			},
			singleRun: true,
			concurrency: Infinity,
			browserNoActivityTimeout: 0
		} );
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
			'workspace/node_modules/ckeditor5-engine/tests/**/*.js',
			'workspace/node_modules/ckeditor5-utils/tests/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed excluded packages as files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '!engine' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/node_modules/ckeditor5-!(engine)*/tests/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed package directories as files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ 'engine/view' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/node_modules/ckeditor5-engine/tests/view/**/*.js',
		] );
	} );

	it( 'should return karma config with transformed glob as files', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ 'engine/model/**/*.js' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.files ).to.deep.eq( [
			'workspace/node_modules/ckeditor5-engine/tests/model/**/*.js',
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

	it( 'should throw an error if no files are provided', () => {
		const spy = sandbox.spy( getKarmaConfig );

		try {
			spy( {
				reporter: 'mocha'
			} );
		} catch ( err ) {}

		expect( spy.threw() ).to.equal( true );
	} );
} );
