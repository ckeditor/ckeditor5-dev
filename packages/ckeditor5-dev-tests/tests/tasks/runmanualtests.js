/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
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
		mockery.registerMock( '../utils/createmanualtestserver', ( buildDir ) => {
			expect( buildDir ).to.equal( 'workspace/build/.manual-tests' );

			return Promise.resolve();
		} );

		mockery.registerMock( '../utils/compilemanualtestscripts', ( buildDir, manualTestPattern ) => {
			expect( buildDir ).to.equal( 'workspace/build/.manual-tests' );
			expect( manualTestPattern ).to.equal( 'workspace/node_modules/ckeditor5-*/tests/**/manual/**' );

			return Promise.resolve();
		} );
		mockery.registerMock( '../utils/compilemanualtesthtmlfiles', ( buildDir, manualTestPattern ) => {
			expect( buildDir ).to.equal( 'workspace/build/.manual-tests' );
			expect( manualTestPattern ).to.equal( 'workspace/node_modules/ckeditor5-*/tests/**/manual/**' );

			return Promise.resolve();
		} );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd', () => 'workspace' );

		const runManualTests = require( '../../lib/tasks/runManualTests' );
		const promise = runManualTests();

		return promise;
	} );
} );
