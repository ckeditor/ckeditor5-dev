/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const mockery = require( 'mockery' );
const utils = require( '../lib/utils' );
const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );

describe( 'Tests', () => {
	let sandbox, servers, tasks, clock, onServer;

	beforeEach( () => {
		servers = [];
		onServer = null;

		clock = sinon.useFakeTimers();
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'karma', {
			Server: function Server( config, callback ) {
				const server = {
					config,
					callback,
					start() {
						callback( 0 );
					}
				};

				servers.push( server );

				if ( onServer ) {
					onServer( server );
				}

				return server;
			}
		} );

		tasks = require( '../lib/tasks' );
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
		clock.restore();
	} );

	describe( 'runTests()', () => {
		it( 'starts Karma', () => {
			const options = {};
			const karmaConfig = {};
			sandbox.stub( utils, 'getKarmaConfig', () => karmaConfig );

			return tasks.runTests( options )
				.then( () => {
					expect( servers.length ).to.equal( 1 );
					expect( servers[ 0 ].config ).to.equal( karmaConfig );
					expect( utils.getKarmaConfig.calledWithExactly( options ) ).to.equal( true );
				} );
		} );

		it( 'rejects the promise if tests ended badly', () => {
			const options = {};

			return tasks.runTests( options )
				.then(
					() => {
						throw new Error( 'should not be here!' );
					},
					() => {
						expect( 'if the promise was resolved the first callback will be called, not this' ).to.be.a( 'string' );
					}
				);
		} );
	} );

	describe( 'test()', () => {
		it( 'starts the compiler', ( done ) => {
			const options = {};
			const karmaConfig = {};
			sandbox.stub( utils, 'getKarmaConfig', () => karmaConfig );

			sandbox.stub( compiler.tasks, 'compile', ( options ) =>  {
				expect( options.verbosity ).to.equal( 'warning' );

				options.onChange();

				expect( servers.length ).to.equal( 0 );

				clock.tick( 5000 );

				return Promise.resolve();
			} );

			onServer = ( server ) => {
				expect( server.config ).to.equal( karmaConfig );

				server.start = done;
			};

			tasks.test( options );
		} );

		it( 'waits for the compiler', ( done ) => {
			const options = {
				files: [ 'engine' ]
			};
			const serverCount = [];

			sandbox.stub( compiler.tasks, 'compile', ( options ) =>  {
				// Get close to the 3000ms limit.
				clock.tick( 2800 );
				serverCount.push( servers.length );

				// But simulate starts of a compilation (first change).
				options.onChange();
				clock.tick( 300 );

				// After 3100ms from the beginning there still should be 0 servers.
				serverCount.push( servers.length );

				// Now tick the 600ms from the last change to finish.
				clock.tick( 300 );

				return Promise.resolve();
			} );

			onServer = ( server ) => {
				server.start = done;
				expect( serverCount ).to.deep.equal( [ 0, 0 ] );
			};

			tasks.test( options );
		} );

		it( 'does not resolve the promise until Karma\'s callback is called', () => {
			const options = {
				files: [ 'engine' ]
			};

			sandbox.stub( compiler.tasks, 'compile', ( options ) =>  {
				options.onChange();

				clock.tick( 5000 );

				return Promise.resolve();
			} );

			onServer = ( server ) => {
				setTimeout( () => {
					server.callback( 0 );
				} );
			};

			return tasks.test( options );
		} );

		it( 'rejects the task when compiler throws an error', () => {
			const compilerOptions = {
				packages: [
					path.join( 'ckeditor5-foo' ),
					path.join( 'node_modules', 'ckeditor5-bar' ),
					path.join( 'node_modules', 'ckeditor5-bar', 'node_modules', 'ckeditor5-foo' )
				],
				formats: {
					esnext: path.join( '.build' )
				}
			};

			return tasks.test( compilerOptions )
				.then(
					() => {
						throw new Error( 'Promise was supposed to be rejected.' );
					},
					( error ) => {
						expect( error.message ).to.match( /^One or more packages passed to the compiler have duplicates/ );
					}
				);
		} );

		it( 'does not run tests when compiler throws an error', () => {
			sandbox.stub( compiler.tasks, 'compile', () => {
				return new Promise( ( resolve, reject ) => {
					clock.tick( 2800 );
					reject( new Error( 'Something went wrong in the Compiler.' ) );
				} );
			} );

			const runTestStub = sandbox.stub( tasks, 'runTests' );

			return tasks.test( {} )
				.then(
					() => {
						throw new Error( 'Promise was supposed to be rejected.' );
					},
					( error ) => {
						// By default, tests start 3 secs after starting the Compiler.
						clock.tick( 500 );

						expect( runTestStub.notCalled ).to.equal( true );
						expect( error.message ).to.equal( 'Something went wrong in the Compiler.' );
					}
				);
		} );
	} );
} );
