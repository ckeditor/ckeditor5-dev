/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { workspace } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'utils', () => {
	describe( 'execOnDependencies', () => {
		let execOnDependencies, sandbox;

		beforeEach( () => {
			execOnDependencies = require( '../../lib/utils/exec-on-dependencies' );

			sandbox = sinon.sandbox.create();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'executes a function for each package', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			const getDirectoriesStub = sandbox.stub( workspace, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures' ),
				workspace: 'packages/'
			};

			const cwdStub = sandbox.stub( process, 'cwd' ).returns( '/home' );

			const chdirStub = sandbox.stub( process, 'chdir' );

			const workspacePath = path.join( options.cwd, options.workspace );

			return execOnDependencies( options, functionToExecute )
				.then( () => {
					expect( cwdStub.calledOnce ).to.equal( true );

					expect( getDirectoriesStub.calledOnce ).to.equal( true );

					expect( functionToExecute.calledTwice ).to.equal( true );
					expect( functionToExecute.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-core' );
					expect( functionToExecute.firstCall.args[ 1 ] ).to.equal( path.join( workspacePath, 'ckeditor5-core' ) );
					expect( functionToExecute.secondCall.args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
					expect( functionToExecute.secondCall.args[ 1 ] ).to.equal( path.join( workspacePath, 'ckeditor5-engine' ) );

					expect( chdirStub.calledOnce ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/home' );
				} );
		} );

		it( 'executes a function for each package and returns called done callback', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );
			const doneCallback = sandbox.stub().returns( 'Done.' );

			const getDirectoriesStub = sandbox.stub( workspace, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures' ),
				workspace: 'packages/'
			};

			const cwdStub = sandbox.stub( process, 'cwd' ).returns( '/home' );

			const chdirStub = sandbox.stub( process, 'chdir' );

			const workspacePath = path.join( options.cwd, options.workspace );

			return execOnDependencies( options, functionToExecute, doneCallback )
				.then( ( doneCallbackResult ) => {
					expect( cwdStub.calledOnce ).to.equal( true );

					expect( getDirectoriesStub.calledOnce ).to.equal( true );
					expect( doneCallback.calledOnce ).to.equal( true );

					expect( functionToExecute.calledTwice ).to.equal( true );
					expect( functionToExecute.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-core' );
					expect( functionToExecute.firstCall.args[ 1 ] ).to.equal( path.join( workspacePath, 'ckeditor5-core' ) );
					expect( functionToExecute.secondCall.args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
					expect( functionToExecute.secondCall.args[ 1 ] ).to.equal( path.join( workspacePath, 'ckeditor5-engine' ) );

					expect( chdirStub.calledOnce ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/home' );

					expect( doneCallbackResult ).to.equal( 'Done.' );
				} );
		} );
	} );
} );
