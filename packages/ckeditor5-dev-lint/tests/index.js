/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const mockery = require( 'mockery' );

describe( 'dev-lint/index', () => {
	let tasks, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			lint: sandbox.stub(),
			lintStaged: sandbox.stub()
		};

		mockery.registerMock( './tasks/lint', stubs.lint );
		mockery.registerMock( './tasks/lintstaged', stubs.lintStaged );

		tasks = require( '../lib/index' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'lint()', () => {
		it( 'executes the lint task', () => {
			tasks.lint( 'foo', 2 );

			expect( stubs.lint.calledOnce ).to.equal( true );
			expect( stubs.lint.firstCall.args[ 0 ] ).to.equal( 'foo' );
			expect( stubs.lint.firstCall.args[ 1 ] ).to.equal( 2 );
		} );
	} );

	describe( 'lintStaged()', () => {
		it( 'executes the lintStaged task', () => {
			tasks.lintStaged( 'foo', 2 );

			expect( stubs.lintStaged.calledOnce ).to.equal( true );
			expect( stubs.lintStaged.firstCall.args[ 0 ] ).to.equal( 'foo' );
			expect( stubs.lintStaged.firstCall.args[ 1 ] ).to.equal( 2 );
		} );
	} );
} );
