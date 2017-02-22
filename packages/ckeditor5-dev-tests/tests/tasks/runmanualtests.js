/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'runManualTests', () => {
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should run manual tests and return promise', () => {
		const serverSpy = sandbox.spy( () => Promise.resolve() );
		const htmlFileCompilerSpy = sandbox.spy( () => Promise.resolve() );
		const scriptCompilerSpy = sandbox.spy( () => Promise.resolve() );
		const removeDirSpy = sandbox.spy( () => Promise.resolve() );

		mockery.registerMock( '../utils/manual-tests/createserver', serverSpy );
		mockery.registerMock( '../utils/manual-tests/compilehtmlfiles', htmlFileCompilerSpy );
		mockery.registerMock( '../utils/manual-tests/compilescripts', scriptCompilerSpy );
		mockery.registerMock( '../utils/manual-tests/removedir', removeDirSpy );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd', () => 'workspace' );

		const runManualTests = require( '../../lib/tasks/runmanualtests' );

		return runManualTests().then( () => {
			sinon.assert.calledWithExactly(
				removeDirSpy,
				'workspace/build/.manual-tests'
			);

			sinon.assert.calledWithExactly(
				htmlFileCompilerSpy,
				'workspace/build/.manual-tests',
				'workspace/packages/ckeditor5-*/tests/**/manual/**'
			);
			sinon.assert.calledWithExactly(
				scriptCompilerSpy,
				'workspace/build/.manual-tests',
				'workspace/packages/ckeditor5-*/tests/**/manual/**'
			);

			sinon.assert.calledWithExactly(
				serverSpy,
				'workspace/build/.manual-tests'
			);
		} );
	} );
} );
