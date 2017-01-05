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

		mockery.registerMock( '../utils/createmanualtestserver', serverSpy );
		mockery.registerMock( '../utils/compilemanualtesthtmlfiles', htmlFileCompilerSpy );
		mockery.registerMock( '../utils/compilemanualtestscripts', scriptCompilerSpy );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd', () => 'workspace' );

		const runManualTests = require( '../../lib/tasks/runmanualtests' );

		return runManualTests().then( () => {
			sinon.assert.calledWithExactly( serverSpy, 'workspace/build/.manual-tests' );
			sinon.assert.calledWithExactly(
				htmlFileCompilerSpy,
				'workspace/build/.manual-tests',
				'workspace/node_modules/ckeditor5-*/tests/**/manual/**'
			);
			sinon.assert.calledWithExactly(
				scriptCompilerSpy,
				'workspace/build/.manual-tests',
				'workspace/node_modules/ckeditor5-*/tests/**/manual/**'
			);
		} );
	} );
} );
