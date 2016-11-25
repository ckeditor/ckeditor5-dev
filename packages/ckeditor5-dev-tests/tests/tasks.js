/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const readline = require( 'readline' );
const path = require( 'path' );
const fs = require( 'fs-extra' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const mockery = require( 'mockery' );
const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
const proxyquire = require( 'proxyquire' );
const utils = require( '../lib/utils' );
const NotifierPlugin = require( '../lib/notifier-plugin' );

describe( 'Tests', () => {
	let sandbox, tasks, clock;
	let servers, serverEvents, exitCode, onServer;
	let infoSpy, errorSpy, loggerVerbosity;

	beforeEach( () => {
		servers = [];
		serverEvents = [];
		onServer = null;
		exitCode = 0;

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
						callback( exitCode );
					},
					on( event, callback ) {
						serverEvents.push( event );
						callback();
					}
				};

				servers.push( server );

				if ( onServer ) {
					onServer( server );
				}

				return server;
			}
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger( verbosity ) {
				loggerVerbosity = verbosity;
				infoSpy = sinon.spy();
				errorSpy = sinon.spy();

				return {
					info: infoSpy,
					error: errorSpy
				};
			}
		} );
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
		clock.restore();
	} );

	describe( 'automated.runTests()', () => {
		beforeEach( () => {
			tasks = require( '../lib/tasks' );
		} );

		it( 'starts Karma', () => {
			const options = {};
			const karmaConfig = {};
			sandbox.stub( utils, '_getKarmaConfig', () => karmaConfig );

			return tasks.automated.runTests( options )
				.then( () => {
					expect( servers.length ).to.equal( 1 );
					expect( servers[ 0 ].config ).to.equal( karmaConfig );
					expect( utils._getKarmaConfig.calledWithExactly( options ) ).to.equal( true );
				} );
		} );

		it( 'displays a path to the coverage report', () => {
			const options = { coverage: true, sourcePath: './' };
			const karmaConfig = {};
			sandbox.stub( utils, '_getKarmaConfig', () => karmaConfig );

			return tasks.automated.runTests( options )
				.then(
					() => {
						clock.tick( 100 );

						expect( serverEvents ).to.deep.equal( [ 'run_complete' ] );
						expect( infoSpy.calledOnce ).to.equal( true );
					},
					() => {
						throw new Error( 'Promise was supposed to be resolved.' );
					}
				);
		} );

		it( 'rejects the promise if tests ended badly #1', () => {
			const options = {};

			return tasks.automated.runTests( options )
				.then(
					() => {
						throw new Error( 'should not be here!' );
					},
					() => {
						expect( 'if the promise was resolved the first callback will be called, not this' ).to.be.a( 'string' );
					}
				);
		} );

		it( 'rejects the promise if tests ended badly #2', () => {
			exitCode = 1;

			const options = {};
			const karmaConfig = {};
			const processExitStub = sandbox.stub( process, 'exit' );
			sandbox.stub( utils, '_getKarmaConfig', () => karmaConfig );

			return tasks.automated.runTests( options )
				.then(
					() => {
						throw new Error( 'should not be here!' );
					},
					() => {
						expect( processExitStub.calledOnce ).to.equal( true );
						expect( processExitStub.firstCall.args[ 0 ] ).to.equal( 1 );
					}
				);
		} );
	} );

	describe( 'automated.test()', () => {
		beforeEach( () => {
			tasks = require( '../lib/tasks' );
		} );

		it( 'starts the compiler', ( done ) => {
			const options = {};
			const karmaConfig = {};
			sandbox.stub( utils, '_getKarmaConfig', () => karmaConfig );

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

			tasks.automated.test( options );
		} );

		it( 'waits for the compiler', () => {
			const options = {
				files: [ 'engine' ]
			};
			const serverCount = [];

			sandbox.stub( compiler.tasks, 'compile', ( options ) =>  {
				expect( loggerVerbosity ).to.equal( undefined );
				expect( infoSpy.callCount ).to.equal( 1 );

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

			return tasks.automated.test( options )
				.then( () => {
					expect( infoSpy.callCount ).to.equal( 2 );
					expect( serverCount ).to.deep.equal( [ 0, 0 ] );
				} );
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

			return tasks.automated.test( options );
		} );

		it( 'rejects the task when compiler throws an error', () => {
			const compilerOptions = {
				packages: [
					path.join( 'ckeditor5-foo' ),
					path.join( 'node_modules', 'ckeditor5-bar' ),
					path.join( 'node_modules', 'ckeditor5-bar', 'node_modules', 'ckeditor5-foo' )
				]
			};

			return tasks.automated.test( compilerOptions )
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

			const runTestStub = sandbox.stub( tasks.automated, 'runTests' );

			return tasks.automated.test( {} )
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

		it( 'informs about error when runTests will fail', () => {
			const error = new Error( 'Something went wrong in "runTests".' );

			sandbox.stub( compiler.tasks, 'compile', () => {
				return new Promise( ( resolve ) => {
					clock.tick( 3000 );
					resolve();
				} );
			} );

			sandbox.stub( tasks.automated, 'runTests', () => {
				return new Promise( ( resolve, reject ) => {
					reject( error );
				} );
			} );

			return tasks.automated.test( {} )
				.then(
					() => {
						throw new Error( 'Promise was supposed to be rejected.' );
					},
					( err ) => {
						expect( errorSpy.calledOnce ).to.equal( true );
						expect( errorSpy.firstCall.args[ 0 ] ).to.equal( error.message );
						expect( err ).to.equal( error );
					}
				);
		} );
	} );

	describe( 'manual.compileScripts()', () => {
		let sourcePath, outputPath, webpackConfig;

		beforeEach( () => {
			sourcePath = path.resolve( '.' );
			outputPath = path.join( sourcePath, '.output' );
		} );

		it( 'compiles the scripts', () => {
			tasks = proxyquire( '../lib/tasks', {
				'webpack': ( config, callback ) => {
					webpackConfig = config;

					callback();
				}
			} );

			const _getWebpackConfigStub = sandbox.stub( utils, '_getWebpackConfig' )
				.returns( {
					plugins: []
				} );
			const _getWebpackEntriesForManualTestsStub = sandbox.stub( utils, '_getWebpackEntriesForManualTests' )
				.returns( { 'a.js': 'a/manual.js' } );

			return tasks.manual.compileScripts( sourcePath, outputPath )
				.then( () => {
					expect( _getWebpackConfigStub.calledOnce ).to.equal( true );
					expect( _getWebpackEntriesForManualTestsStub.calledOnce ).to.equal( true );

					expect( webpackConfig.plugins.length ).to.equal( 1 );
					expect( webpackConfig.plugins[ 0 ] ).to.be.an.instanceof( NotifierPlugin );
					expect( webpackConfig.watch ).to.equal( true );
					expect( webpackConfig.entry ).to.deep.equal( { 'a.js': 'a/manual.js' } );
					expect( webpackConfig.output ).to.deep.equal( {
						path: outputPath,
						filename: '[name]'
					} );
				} );
		} );

		it( 'rejects a promise when file cannot be saved', () => {
			const error = new Error( 'Unexpected error.' );

			tasks = proxyquire( '../lib/tasks', {
				'webpack': ( config, callback ) => {
					callback( error );
				}
			} );

			sandbox.stub( utils, '_getWebpackConfig' ).returns( { plugins: [] } );
			sandbox.stub( utils, '_getWebpackEntriesForManualTests' ).returns( {} );

			return tasks.manual.compileScripts( sourcePath, outputPath )
				.then(
					() => {
						throw new Error( 'Promise was supposed to be rejected.' );
					},
					( err ) => {
						expect( err ).to.equal( error );

						mockery.deregisterMock( 'webpack' );
					}
				);
		} );
	} );

	describe( 'manual.compileViews()', () => {
		let sourcePath, outputPath, files;

		const template = '<html></html>';

		beforeEach( () => {
			sourcePath = path.resolve( '.' );
			outputPath = path.join( sourcePath, '.output' );
			files = {
				engine: {
					js: path.join( 'tests', 'engine', 'manual', 'test-manual.js' ),
					html: path.join( 'tests', 'engine', 'manual', 'test-manual.html' ),
					md: path.join( 'tests', 'engine', 'manual', 'test-manual.md' )
				},
				core: {
					js: path.join( 'tests', 'core', 'manual', 'other-name-of-test.js' ),
					html: path.join( 'tests', 'core', 'manual', 'other-name-of-test.html' ),
					md: path.join( 'tests', 'core', 'manual', 'other-name-of-test.md' )
				}
			};

			tasks = require( '../lib/tasks' );
		} );

		it( 'saves manual test views', () => {
			let watchFilesHandler;

			const readFileSyncStub = sandbox.stub( fs, 'readFileSync' )
				.returns( template );
			const manualTestPathsStub = sandbox.stub( utils, '_getManualTestPaths' )
				.returns( [ files.engine.js, files.core.js ] );
			const compileViewStub = sandbox.stub( utils, '_compileView' )
				.returns( Promise.resolve() );
			const watchFilesStub = sandbox.stub( utils, '_watchFiles', ( pathToFiles, handler ) => {
				watchFilesHandler = handler;
			} );

			tasks.manual.compileViews( sourcePath, outputPath );

			expect( readFileSyncStub.calledOnce ).to.equal( true );
			expect( manualTestPathsStub.calledOnce ).to.equal( true );
			expect( manualTestPathsStub.firstCall.args[ 0 ] ).to.equal( sourcePath );

			// Checks whether the watchers have been called.
			expect( watchFilesStub.calledTwice ).to.equal( true );

			expect( watchFilesStub.firstCall.args[ 0 ] ).to.deep.equal( [
				path.join( sourcePath, files.engine.html ),
				path.join( sourcePath, files.engine.md )
			] );

			expect( watchFilesStub.firstCall.args[ 1 ] ).to.be.a( 'function' );

			expect( watchFilesStub.secondCall.args[ 0 ] ).to.deep.equal( [
				path.join( sourcePath, files.core.html ),
				path.join( sourcePath, files.core.md )
			] );

			expect( watchFilesStub.secondCall.args[ 1 ] ).to.be.a( 'function' );

			// Checks whether the views have been compiled.
			expect( compileViewStub.calledTwice ).to.equal( true );
			expect( compileViewStub.firstCall.args[ 0 ] ).to.equal( sourcePath );
			expect( compileViewStub.firstCall.args[ 1 ] ).to.equal( outputPath );
			expect( compileViewStub.firstCall.args[ 2 ] ).to.equal( path.join( sourcePath, files.engine.html ) );
			expect( compileViewStub.firstCall.args[ 3 ] ).to.equal( template );
			expect( compileViewStub.secondCall.args[ 0 ] ).to.equal( sourcePath );
			expect( compileViewStub.secondCall.args[ 1 ] ).to.equal( outputPath );
			expect( compileViewStub.secondCall.args[ 2 ] ).to.equal( path.join( sourcePath, files.core.html ) );
			expect( compileViewStub.secondCall.args[ 3 ] ).to.equal( template );

			// Check whether the handler for watched files is correct.
			expect( watchFilesHandler ).to.be.a( 'function' );
			watchFilesHandler( path.join( sourcePath, files.engine.md ) );

			expect( compileViewStub.calledThrice ).to.equal( true );
			expect( compileViewStub.thirdCall.args[ 0 ] ).to.equal( sourcePath );
			expect( compileViewStub.thirdCall.args[ 1 ] ).to.equal( outputPath );
			expect( compileViewStub.thirdCall.args[ 2 ] ).to.equal( path.join( sourcePath, files.engine.md ) );
			expect( compileViewStub.thirdCall.args[ 3 ] ).to.equal( template );
		} );
	} );

	describe( 'manual.run()', () => {
		it( 'waits for the compiler and runs the http server', ( done ) => {
			const destinationPath = path.resolve( 'build', '.manual-tests' );

			tasks = proxyquire( '../lib/tasks', {
				'./server': ( sourceRoot, serverRoot ) => {
					expect( sourceRoot ).to.equal( destinationPath );
					expect( serverRoot ).to.equal( path.join( destinationPath, 'manual-tests' ) );
					done();
				}
			} );

			// Resolve promises with compilation scripts and views.
			const compileScriptsStub = sandbox.stub( tasks.manual, 'compileScripts' ).returns( Promise.resolve() );
			sandbox.stub( tasks.manual, 'compileViews' );

			// Don't attach events.
			sandbox.stub( process, 'on' );

			// Simulate work of the Compiler.
			sandbox.stub( compiler.tasks, 'compile', ( options ) => {
				expect( infoSpy.calledOnce ).to.equal( true );

				// Get close to the 3000ms limit.
				clock.tick( 2800 );

				// But simulate starts of a compilation (first change).
				options.onChange();
				clock.tick( 300 );

				// After 3100ms from the beginning `tasks.manual.compileScripts` shouldn't be called.
				expect( compileScriptsStub.called ).to.equal( false );

				// Now tick the 600ms from the last change to finish.
				clock.tick( 300 );

				expect( compileScriptsStub.called ).to.equal( true );

				return Promise.resolve();
			} );

			tasks.manual.run( {}, sandbox.spy() );
		} );

		it( 'breaks the process when compiler throws an error', ( done ) => {
			const error = new Error( 'Unexpected error.' );
			const compileScriptsStub = sandbox.stub( tasks.manual, 'compileScripts' );

			// Don't attach events
			sandbox.stub( process, 'on' );

			// Simulate work of the Compiler.
			sandbox.stub( compiler.tasks, 'compile', () => {
				clock.tick( 2800 );

				return Promise.reject( error );
			} );

			tasks.manual.run( {
				destinationPath: path.resolve( '.' )
			}, ( err ) => {
				// By default, compilation for manual tests start 3 secs after starting the Compiler.
				clock.tick( 500 );

				expect( err ).to.equal( error );
				expect( compileScriptsStub.called ).to.equal( false );

				done();
			} );
		} );

		it( 'closes server and finish task when user breaks it manually', ( done ) => {
			// Function handles the CTRL+C (SIGINT).
			let onSigIntHandler;

			// Function which closes the HTTP server.
			const closeServerSpy = sandbox.spy();

			tasks = proxyquire( '../lib/tasks', {
				'./server': () => {
					// After starting the server, user wants to finish.
					// User pressed CTRL+C and `process` caught this event.
					process.emit( 'SIGINT' );

					return {
						close: closeServerSpy
					};
				}
			} );

			// Simulate work of the Compiler.
			sandbox.stub( compiler.tasks, 'compile', () => {
				clock.tick( 3500 );

				return Promise.resolve();
			} );

			// Resolve promises with compilation scripts and views.
			sandbox.stub( tasks.manual, 'compileScripts' ).returns( Promise.resolve() );
			sandbox.stub( tasks.manual, 'compileViews' );

			// We must stub the `process.emit()` method because other npm scripts (like test)
			// can also attach its events. If we don't do this, we will break all tests at this moment.
			sandbox.stub( process, 'emit', () => {
				// Execute `onSigIntHandler` handler at the end of the test.
				clock.restore();
				setTimeout( onSigIntHandler );

				expect( processOnStub.calledOnce ).to.equal( true );
			} );

			// Execute the `handler` manually.
			const processOnStub = sandbox.stub( process, 'on', ( event, handler ) => {
				onSigIntHandler = () => {
					handler();

					expect( closeServerSpy.calledOnce ).to.equal( true );
				};
			} );

			// Prevent to unexpected finish.
			sandbox.stub( process, 'exit' );

			tasks.manual.run( {
				destinationPath: path.resolve( '.' )
			}, done );
		} );

		it( 'closes server and finish task when user breaks it manually (Windows)', ( done ) => {
			// Function handles the CTRL+C (SIGINT), but doesn't work on Windows proper.
			let onSigIntProcessHandler;

			// Function handles the CTR+C (SIGINT) on Windows.
			let onSigIntReadlineHandler;

			// Mock result of `readline.createInterface()` method.
			const readLineInterface = {
				on: ( event, handler ) => {
					onSigIntReadlineHandler = handler;
				},
				emit: () => {
					onSigIntReadlineHandler();
				}
			};

			tasks = proxyquire( '../lib/tasks', {
				'./server': () => {
					// User pressed CTRL+C faster than server starts and `readline` caught this event.
					readLineInterface.emit( 'SIGINT' );

					return null;
				}
			} );

			// Check whether the readline received correct parameters.
			sandbox.stub( readline, 'createInterface', ( options ) => {
				expect( options.input ).to.equal( process.stdin );
				expect( options.output ).to.equal( process.stdout );

				return readLineInterface;
			} );

			// Simulate work of the Compiler.
			sandbox.stub( compiler.tasks, 'compile', () => {
				clock.tick( 3500 );

				return Promise.resolve();
			} );

			// Resolve promises with compilation scripts and views.
			sandbox.stub( tasks.manual, 'compileScripts' ).returns( Promise.resolve() );
			sandbox.stub( tasks.manual, 'compileViews' );

			// Mock user's platform.
			sandbox.stub( utils, '_getPlatform' ).returns( 'win32' );

			// We must stub the `process.emit()` method because other npm scripts (like test)
			// can also attach its events. If we don't do this, we will break all tests at this moment.
			sandbox.stub( process, 'emit', () => {
				onSigIntProcessHandler();

				expect( processOnStub.calledOnce ).to.equal( true );
			} );

			// Execute the `handler` manually.
			const processOnStub = sandbox.stub( process, 'on', ( event, handler ) => {
				onSigIntProcessHandler = handler;
			} );

			// Prevent to unexpected finish.
			sandbox.stub( process, 'exit' );

			tasks.manual.run( {
				destinationPath: path.resolve( '.' )
			}, done );
		} );
	} );
} );
