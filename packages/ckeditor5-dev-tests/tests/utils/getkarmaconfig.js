/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'getkarmaconfig', () => {
	let getKarmaConfig;
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd', () => 'workspace' );
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
} );
