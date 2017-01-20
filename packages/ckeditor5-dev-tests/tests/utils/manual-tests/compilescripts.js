/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe( 'compileManualTestScripts', () => {
	let sandbox;

	beforeEach( () => {
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should compile manual test scripts', () => {
		const webpackSpy = sandbox.spy( ( config, callback ) => callback() );
		const getWebpackConfigSpy = sandbox.spy( ( entries, buildDir ) => ( {
			entries,
			buildDir
		} ) );

		mockery.registerMock( '../glob', () => [ 'file1', 'file2' ] );
		mockery.registerMock( './getwebpackconfig', getWebpackConfigSpy );
		mockery.registerMock( '../getrelativefilepath', ( x ) => x );
		mockery.registerMock( 'webpack', webpackSpy );
		sandbox.mock( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

		const compileManualTestScripts = require( '../../../lib/utils/manual-tests/compilescripts' );

		return compileManualTestScripts( 'buildDir', 'manualTestPattern' ).then( () => {
			expect( getWebpackConfigSpy.getCall( 0 ).args[ 0 ] ).to.deep.equal( { file1: 'file1', file2: 'file2' } );
			expect( getWebpackConfigSpy.getCall( 0 ).args[ 1 ] ).to.deep.equal( 'buildDir' );
			expect( webpackSpy.getCall( 0 ).args[ 0 ] ).to.deep.equal( { buildDir: 'buildDir', entries: { file1: 'file1', file2: 'file2' } } );
		} );
	} );
} );
