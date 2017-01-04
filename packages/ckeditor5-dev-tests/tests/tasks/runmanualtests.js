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
	} );

	it( 'should run manual tests and return promise', () => {
		const serverSpy = sandbox.spy( () => Promise.resolve() );
		const htmlFileCompilerSpy = sandbox.spy( () => Promise.resolve() );
		const scriptCompiler = sandbox.spy( () => Promise.resolve() );

		mockery.registerMock( '../utils/createmanualtestserver', serverSpy );
		mockery.registerMock( '../utils/compilemanualtesthtmlfiles', htmlFileCompilerSpy );
		mockery.registerMock( '../utils/compilemanualtestscripts', scriptCompiler );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd', () => 'workspace' );

		const runManualTests = require( '../../lib/tasks/runManualTests' );

		return runManualTests().then( () => {
			sinon.assert.calledWith( serverSpy, 'workspace/build/.manual-tests' );
			sinon.assert.calledWith( htmlFileCompilerSpy, 'workspace/build/.manual-tests', 'workspace/node_modules/ckeditor5-*/tests/**/manual/**' );
			sinon.assert.calledWith( scriptCompiler, 'workspace/build/.manual-tests', 'workspace/node_modules/ckeditor5-*/tests/**/manual/**' );
		} );
	} );
} );
