/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;

describe( 'runManualTests', () => {
	let sandbox, spies, testsToExecute, runManualTests;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		spies = {
			server: sandbox.spy( () => Promise.resolve() ),
			htmlFileCompiler: sandbox.spy( () => Promise.resolve() ),
			scriptCompiler: sandbox.spy( () => Promise.resolve() ),
			removeDir: sandbox.spy( () => Promise.resolve() ),
			fileOptionToGlob: sandbox.stub()
		};

		mockery.registerMock( '../utils/manual-tests/createserver', spies.server );
		mockery.registerMock( '../utils/manual-tests/compilehtmlfiles', spies.htmlFileCompiler );
		mockery.registerMock( '../utils/manual-tests/compilescripts', spies.scriptCompiler );
		mockery.registerMock( '../utils/manual-tests/removedir', spies.removeDir );
		mockery.registerMock( '../utils/fileoptiontoglob', spies.fileOptionToGlob );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd', () => 'workspace' );

		runManualTests = require( '../../lib/tasks/runmanualtests' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should run all manual tests and return promise', () => {
		const testsToExecute = 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js';
		spies.fileOptionToGlob.returns( testsToExecute );

		return runManualTests( {} )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.fileOptionToGlob.calledOnce ).to.equal( true );
				expect( spies.fileOptionToGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.fileOptionToGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.htmlFileCompiler.firstCall.args[ 1 ] ).to.deep.equal( [ testsToExecute ] );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.scriptCompiler.firstCall.args[ 1 ] ).to.deep.equal( [ testsToExecute ] );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'run specified manual tests', () => {
		testsToExecute = [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js'
		];

		spies.fileOptionToGlob.onFirstCall().returns( testsToExecute[ 0 ] );
		spies.fileOptionToGlob.onSecondCall().returns( testsToExecute[ 1 ] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			]
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.fileOptionToGlob.calledTwice ).to.equal( true );
				expect( spies.fileOptionToGlob.firstCall.args[ 0 ] ).to.equal( 'build-classic' );
				expect( spies.fileOptionToGlob.firstCall.args[ 1 ] ).to.equal( true );
				expect( spies.fileOptionToGlob.secondCall.args[ 0 ] ).to.equal( 'editor-classic/manual/classic.js' );
				expect( spies.fileOptionToGlob.secondCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.htmlFileCompiler.firstCall.args[ 1 ] ).to.deep.equal( testsToExecute );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.scriptCompiler.firstCall.args[ 1 ] ).to.deep.equal( testsToExecute );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );
} );
