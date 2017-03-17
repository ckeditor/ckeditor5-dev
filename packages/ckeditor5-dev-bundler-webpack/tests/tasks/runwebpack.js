/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;

describe( 'dev-bundler-webpack/tasks', () => {
	let runWebpack, sandbox, stubs, error, webpackConfig;

	beforeEach( () => {
		error = null;
		webpackConfig = null;

		sandbox = sinon.sandbox.create();

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			webpack: sandbox.spy( ( config, callback ) => {
				webpackConfig = config;
				callback( error );
			} )
		};

		mockery.registerMock( 'webpack', stubs.webpack );

		runWebpack = require( '../../lib/tasks/runwebpack' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'runWebpack()', () => {
		it( 'rejects a promise if webpack threw an error', () => {
			error = new Error( 'Unexpected error.' );

			return runWebpack( {} )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					( err ) => {
						expect( err ).to.equal( error );
					}
				);
		} );

		it( 'resolves a promise if webpack did not throw any error', () => {
			return runWebpack( { foo: 'bar' } )
				.then( () => {
					expect( webpackConfig ).to.deep.equal( { foo: 'bar' } );
				} );
		} );
	} );
} );
