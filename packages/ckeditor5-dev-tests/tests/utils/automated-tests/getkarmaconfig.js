/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'getKarmaConfig()', () => {
	let getKarmaConfig, sandbox, karmaConfigOverrides;

	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		karmaConfigOverrides = sandbox.spy();
		sandbox.stub( process, 'cwd' ).returns( 'workspace' );
		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		// Sinon cannot stub non-existing props.
		process.env = Object.assign( {}, originalEnv, { TRAVIS: false } );

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( './getwebpackconfig', options => options );
		mockery.registerMock( 'karma-config-overrides', karmaConfigOverrides );

		getKarmaConfig = require( '../../../lib/utils/automated-tests/getkarmaconfig' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();

		process.env = originalEnv;
	} );

	it( 'should return basic karma config for all tested files', () => {
		const options = {
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
		};

		const karmaConfig = getKarmaConfig( options );

		expect( karmaConfig ).to.have.own.property( 'basePath', 'workspace' );
		expect( karmaConfig ).to.have.own.property( 'frameworks' );
		expect( karmaConfig ).to.have.own.property( 'files' );
		expect( karmaConfig ).to.have.own.property( 'preprocessors' );
		expect( karmaConfig ).to.have.own.property( 'webpack' );
		expect( karmaConfig.webpack ).to.deep.equal( { ...options, files: [ 'workspace/packages/ckeditor5-*/tests/**/*.js' ] } );
		expect( karmaConfig ).to.have.own.property( 'webpackMiddleware' );
		expect( karmaConfig ).to.have.own.property( 'reporters' );
		expect( karmaConfig ).to.have.own.property( 'browsers' );
		expect( karmaConfig ).to.have.own.property( 'singleRun', true );
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
		expect( karmaConfig.proxies ).to.have.own.property( '/assets/' );
		expect( karmaConfig.proxies ).to.have.own.property( '/example.com/image.png' );
		expect( karmaConfig.proxies ).to.have.own.property( '/www.example.com/image.png' );

		expect( karmaConfig.files ).to.be.an( 'array' );
		expect( karmaConfig.files.length ).to.equal( 2 );
		expect( karmaConfig.files[ 0 ] ).to.equal( 'workspace/entry-file.js' );
		expect( karmaConfig.files[ 1 ].pattern ).to.equal( 'packages/ckeditor5-utils/tests/_assets/**/*' );
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

	it( 'should enable webpack watcher when passed the "karmaConfigOverrides" option (execute in Intellij)', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: 'karma-config-overrides',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig.webpack ).to.contain.property( 'watch', true );
	} );

	it( 'should configure coverage reporter', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: 'karma-config-overrides',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			},
			coverage: true
		} );

		expect( karmaConfig.reporters ).to.contain( 'coverage' );
		expect( karmaConfig.coverageReporter ).to.contain.property( 'reporters' );
	} );

	it( 'should remove webpack babel-loader if coverage reporter is removed by overrides', () => {
		mockery.registerMock( 'karma-config-overrides-remove-coverage', config => {
			config.reporters.splice( config.reporters.indexOf( 'coverage' ), 1 );
		} );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: 'karma-config-overrides-remove-coverage',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			},
			module: {
				rules: [
					{
						loader: 'babel-loader'
					},
					{
						loader: 'other-loader'
					}
				]
			},
			coverage: true
		} );

		const loaders = karmaConfig.webpack.module.rules.map( rule => rule.loader );

		expect( karmaConfig.reporters ).to.not.contain( 'coverage' );
		expect( loaders ).to.not.contain( 'babel-loader' );
		expect( loaders ).to.contain( 'other-loader' );
	} );

	it( 'should return custom launchers with flags', () => {
		const options = {
			reporter: 'mocha',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		};

		const karmaConfig = getKarmaConfig( options );

		expect( karmaConfig ).to.have.own.property( 'customLaunchers' );
		expect( karmaConfig.customLaunchers ).to.have.own.property( 'CHROME_TRAVIS_CI' );
		expect( karmaConfig.customLaunchers ).to.have.own.property( 'CHROME_LOCAL' );

		expect( karmaConfig.customLaunchers.CHROME_TRAVIS_CI ).to.have.own.property( 'base', 'Chrome' );
		expect( karmaConfig.customLaunchers.CHROME_TRAVIS_CI ).to.have.own.property( 'flags' );
		expect( karmaConfig.customLaunchers.CHROME_TRAVIS_CI.flags ).to.deep.equal( [
			'--disable-background-timer-throttling',
			'--js-flags="--expose-gc"',
			'--disable-renderer-backgrounding',
			'--disable-backgrounding-occluded-windows',
			'--no-sandbox'
		] );

		expect( karmaConfig.customLaunchers.CHROME_LOCAL ).to.have.own.property( 'base', 'Chrome' );
		expect( karmaConfig.customLaunchers.CHROME_LOCAL ).to.have.own.property( 'flags' );
		expect( karmaConfig.customLaunchers.CHROME_LOCAL.flags ).to.deep.equal( [
			'--disable-background-timer-throttling',
			'--js-flags="--expose-gc"',
			'--disable-renderer-backgrounding',
			'--disable-backgrounding-occluded-windows',
			'--remote-debugging-port=9222'
		] );
	} );
} );
