/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;

describe( 'runManualTests', () => {
	let sandbox, spies, testsToExecute, runManualTests;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

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
			copyAssets: sandbox.spy(),
			transformFileOptionToTestGlob: sandbox.stub()
		};

		mockery.registerMock( '../utils/manual-tests/createserver', spies.server );
		mockery.registerMock( '../utils/manual-tests/compilehtmlfiles', spies.htmlFileCompiler );
		mockery.registerMock( '../utils/manual-tests/compilescripts', spies.scriptCompiler );
		mockery.registerMock( '../utils/manual-tests/removedir', spies.removeDir );
		mockery.registerMock( '../utils/manual-tests/copyassets', spies.copyAssets );
		mockery.registerMock( '../utils/transformfileoptiontotestglob', spies.transformFileOptionToTestGlob );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd' ).returns( 'workspace' );

		runManualTests = require( '../../lib/tasks/runmanualtests' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should run all manual tests and return promise', () => {
		const testsToExecute = 'workspace/packages/ckeditor5-*/tests/**/manual/**/*.js';
		spies.transformFileOptionToTestGlob.returns( testsToExecute );

		return runManualTests( {} )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledOnce ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( '*' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.htmlFileCompiler.firstCall.args[ 1 ] ).to.deep.equal( [ testsToExecute ] );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.scriptCompiler.firstCall.args[ 1 ] ).to.deep.equal( [ testsToExecute ] );
				expect( spies.scriptCompiler.firstCall.args[ 2 ] ).to.be.undefined;

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );

	it( 'run specified manual tests', () => {
		testsToExecute = [
			'workspace/packages/ckeditor5-build-classic/tests/**/manual/**/*.js',
			'workspace/packages/ckeditor5-editor-classic/tests/manual/**/*.js'
		];

		spies.transformFileOptionToTestGlob.onFirstCall().returns( testsToExecute[ 0 ] );
		spies.transformFileOptionToTestGlob.onSecondCall().returns( testsToExecute[ 1 ] );

		const options = {
			files: [
				'build-classic',
				'editor-classic/manual/classic.js'
			],
			themePath: 'path/to/theme'
		};

		return runManualTests( options )
			.then( () => {
				expect( spies.removeDir.calledOnce ).to.equal( true );
				expect( spies.removeDir.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );

				expect( spies.transformFileOptionToTestGlob.calledTwice ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 0 ] ).to.equal( 'build-classic' );
				expect( spies.transformFileOptionToTestGlob.firstCall.args[ 1 ] ).to.equal( true );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 0 ] )
					.to.equal( 'editor-classic/manual/classic.js' );
				expect( spies.transformFileOptionToTestGlob.secondCall.args[ 1 ] ).to.equal( true );

				expect( spies.htmlFileCompiler.calledOnce ).to.equal( true );
				expect( spies.htmlFileCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.htmlFileCompiler.firstCall.args[ 1 ] ).to.deep.equal( testsToExecute );

				expect( spies.scriptCompiler.calledOnce ).to.equal( true );
				expect( spies.scriptCompiler.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
				expect( spies.scriptCompiler.firstCall.args[ 1 ] ).to.deep.equal( testsToExecute );
				expect( spies.scriptCompiler.firstCall.args[ 2 ] ).to.deep.equal( 'path/to/theme' );

				expect( spies.server.calledOnce ).to.equal( true );
				expect( spies.server.firstCall.args[ 0 ] ).to.equal( 'workspace/build/.manual-tests' );
			} );
	} );
} );
