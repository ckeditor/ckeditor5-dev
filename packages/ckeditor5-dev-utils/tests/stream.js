/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );
const stream = require( 'stream' );
const Vinyl = require( 'vinyl' );

describe( 'stream', () => {
	const utils = require( '../lib/stream' );
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'noop', () => {
		it( 'should return PassTrough stream', () => {
			const PassThrough = stream.PassThrough;
			const ret = utils.noop();
			expect( ret instanceof PassThrough ).to.equal( true );
		} );

		it( 'should return a duplex stream when given a callback and call that callback', () => {
			const spy = sinon.spy();
			const ret = utils.noop( spy );

			ret.write( 'foo' );

			expect( spy.called ).to.equal( true );
			expect( ret.writable ).to.equal( true );
			expect( ret.readable ).to.equal( true );
		} );

		it( 'should return a duplex stream when given a callback and call that callback and that callback returns a Promise', () => {
			const resolvePromise = new Promise( ( r ) => r() );
			const stubPromise = sinon.stub( resolvePromise, 'then' );
			const stub = sinon.stub().returns( resolvePromise );
			const ret = utils.noop( stub );

			ret.write( 'foo' );

			expect( stub.called ).to.equal( true );
			expect( stubPromise.called ).to.equal( true );
			expect( ret.writable ).to.equal( true );
			expect( ret.readable ).to.equal( true );
		} );
	} );

	describe( 'isTestFile', () => {
		function test( path, expected ) {
			it( `returns ${ expected} for ${ path }`, () => {
				const file = new Vinyl( {
					cwd: './',
					path: path,
					contents: new Buffer( '' )
				} );

				expect( utils.isTestFile( file ) ).to.equal( expected );
			} );
		}

		test( 'tests/file.js', true );
		test( 'tests/foo/file.js', true );
		test( 'tests/tests.js', true );
		test( 'tests/_utils-tests/foo.js', true );

		test( 'foo/file.js', false );
		test( 'foo/tests/file.js', false );
		test( 'tests/_foo/file.js', false );
	} );
} );
