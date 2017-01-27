/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const mockery = require( 'mockery' );

describe( 'dev-env/index', () => {
	let tasks, sandbox, execOptions;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( './release-tools/utils/executeondependencies', ( options, functionToExecute ) => {
			execOptions = options;

			const workspacePath = path.join( options.cwd, options.workspace );

			return Promise.resolve()
				.then( () => functionToExecute( 'ckeditor5-core', path.join( workspacePath, 'ckeditor5-core' ) ) )
				.then( () => functionToExecute( 'ckeditor5-engine', path.join( workspacePath, 'ckeditor5-engine' ) ) );
		} );

		tasks = require( '../lib/index' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'generateChangelog()', () => {
		it( 'should be defined', () => {
			expect( tasks.generateChangelog ).to.be.a( 'function' );
		} );
	} );

	describe( 'generateChangelogForDependencies()', () => {
		it( 'executes "generateChangeLog" task on each package', () => {
			const generateChangelogStub = sandbox.stub( tasks, 'generateChangelog' ).returns( Promise.resolve() );

			const chdirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				workspace: 'packages/'
			};

			return tasks.generateChangelogForDependencies( options )
				.then( () => {
					expect( execOptions ).to.deep.equal( {
						cwd: options.cwd,
						workspace: options.workspace
					} );

					expect( chdirStub.calledThrice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( chdirStub.secondCall.args[ 0 ] ).to.match( /ckeditor5-engine$/ );
					expect( chdirStub.thirdCall.args[ 0 ] ).to.equal( options.cwd );

					expect( generateChangelogStub.calledTwice ).to.equal( true );
				} );
		} );
	} );

	describe( 'createRelease()', () => {
		it( 'should be defined', () => {
			expect( tasks.createRelease ).to.be.a( 'function' );
		} );
	} );

	describe( 'releaseDependencies()', () => {
		it( 'executes "createRelease" task on each package', () => {
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' ).returns( Promise.resolve() );

			const chdirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				workspace: 'packages/',
				token: 'GithubToken',
				init: true,
				dependencies: {
					'ckeditor5-core': '0.6.0',
					'ckeditor5-engine': '1.0.1'
				}
			};

			return tasks.releaseDependencies( options )
				.then( () => {
					expect( execOptions ).to.deep.equal( {
						cwd: options.cwd,
						workspace: options.workspace
					} );

					expect( chdirStub.calledThrice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( chdirStub.secondCall.args[ 0 ] ).to.match( /ckeditor5-engine$/ );
					expect( chdirStub.thirdCall.args[ 0 ] ).to.equal( options.cwd );

					expect( createReleaseStub.calledTwice ).to.equal( true );

					const releaseArguments = {
						init: options.init,
						token: options.token,
						dependencies: options.dependencies
					};

					expect( createReleaseStub.firstCall.args[ 0 ] ).to.deep.equal( releaseArguments );
					expect( createReleaseStub.secondCall.args[ 0 ] ).to.deep.equal( releaseArguments );
				} );
		} );
	} );
} );
