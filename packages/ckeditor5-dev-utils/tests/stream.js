/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

		it( 'should wait until a promise returned by the callback is resolved', ( ) => {
			let resolved = false;
			let resolve;

			const stream = utils.noop( () => {
				return new Promise( r => {
					resolve = r;
				} );
			} );

			stream
				.pipe(
					utils.noop( () => {
						expect( resolved ).to.equal( true );
					} )
				);

			stream.write( 'foo' );

			resolved = true;
			resolve();
		} );

		it( 'should fail when a returned promise is rejected', done => {
			const chunks = [];
			const stream = utils.noop( chunk => {
				return new Promise( ( resolve, reject ) => {
					if ( chunk == 'foo' ) {
						reject();
					} else {
						resolve();
					}
				} );
			} );

			stream.pipe( utils.noop( chunk => {
				chunks.push( chunk );
			} ) );

			stream.on( 'end', () => {
				expect( chunks.join() ).to.equal( 'bar' );
				done();
			} );

			stream.write( 'foo' );
			stream.write( 'bar' );
			stream.end();
		} );
	} );

	describe( 'isTestFile', () => {
		function test( path, expected ) {
			it( `returns ${ expected } for ${ path }`, () => {
				const file = new Vinyl( {
					cwd: './',
					path,
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
