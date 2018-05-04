/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'getKarmaConfig', () => {
	let getKarmaConfig, sandbox;
	const originalEnv = process.env;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

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

	describe( 'BrowserStack integration', () => {
		beforeEach( () => {
			process.env.BROWSER_STACK_USERNAME = 'username';
			process.env.BROWSER_STACK_ACCESS_KEY = 'access-key';
		} );

		// BROWSER_STACK_USERNAME=username BROWSER_STACK_ACCESS_KEY=access-key npm run test -- --files=autoformat
		it( 'should be enabled when tests were called on a dev machine', () => {
			// Removes the Travis variables. It protects tests on Travis where the env variables are set by default.
			process.env.TRAVIS_EVENT_TYPE = null;
			process.env.TRAVIS_REPO_SLUG = null;
			process.env.TRAVIS_PULL_REQUEST_SLUG = null;

			const karmaConfig = getKarmaConfig( { reporter: 'mocha', globPatterns: {}, browsers: [ 'BrowserStack_Edge' ] } );

			expect( karmaConfig.browserStack ).to.not.be.a( 'undefined' );
			expect( karmaConfig.browsers ).to.deep.equal( [
				'BrowserStack_Edge'
			] );
		} );

		// A team member made a commit. Travis should use BrowserStack.
		it( 'should be enabled for commit build on Travis', () => {
			process.env.TRAVIS = true;
			process.env.TRAVIS_EVENT_TYPE = 'push';

			const karmaConfig = getKarmaConfig( { reporter: 'mocha', globPatterns: {}, browsers: [ 'BrowserStack_Edge' ] } );

			expect( karmaConfig.browserStack ).to.not.be.a( 'undefined' );
			expect( karmaConfig.browsers ).to.deep.equal( [
				'BrowserStack_Edge'
			] );
		} );

		// A team member made a pull request. Travis should use BrowserStack.
		it( 'should be enabled for pull request build on Travis', () => {
			process.env.TRAVIS = true;
			process.env.TRAVIS_EVENT_TYPE = 'pull_request';
			process.env.TRAVIS_PULL_REQUEST_SLUG = 'ckeditor/ckeditor-foo';
			process.env.TRAVIS_REPO_SLUG = 'ckeditor/ckeditor-foo';

			const karmaConfig = getKarmaConfig( { reporter: 'mocha', globPatterns: {}, browsers: [ 'BrowserStack_Edge' ] } );

			expect( karmaConfig.browserStack ).to.not.be.a( 'undefined' );
			expect( karmaConfig.browsers ).to.deep.equal( [
				'BrowserStack_Edge'
			] );
		} );

		// A community member made a pull request. Travis should not use BrowserStack.
		it( 'should be disabled for pull request build on Travis that comes from community', () => {
			process.env.TRAVIS = true;
			process.env.TRAVIS_EVENT_TYPE = 'pull_request';
			process.env.TRAVIS_PULL_REQUEST_SLUG = 'ckeditor-forked/ckeditor-foo';
			process.env.TRAVIS_REPO_SLUG = 'ckeditor/ckeditor-foo';

			// Encrypted environment variables are not available to pull requests from forks due to
			// the security risk of exposing such information to unknown code.
			delete process.env.BROWSER_STACK_USERNAME;
			delete process.env.BROWSER_STACK_ACCESS_KEY;

			const karmaConfig = getKarmaConfig( {
				reporter: 'mocha',
				globPatterns: {},
				browsers: [ 'BrowserStack_Edge', 'Firefox', 'Chrome', 'BrowserStack_Safari' ]
			} );

			expect( karmaConfig.browserStack ).to.be.a( 'undefined' );
			expect( karmaConfig.browsers ).to.deep.equal( [
				'Firefox',
				'CHROME_TRAVIS_CI'
			] );
		} );
	} );
} );
