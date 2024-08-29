/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const tools = require( '../lib/tools' );
const path = require( 'path' );
const mockery = require( 'mockery' );

describe( 'utils', () => {
	let sandbox, infoSpy, errorSpy, loggerVerbosity;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( './logger', verbosity => {
			loggerVerbosity = verbosity;
			infoSpy = sinon.spy();
			errorSpy = sinon.spy();

			return {
				info: infoSpy,
				error: errorSpy
			};
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'tools', () => {
		describe( 'createSpinner', () => {
			it( 'should be defined', () => expect( tools.createSpinner ).to.be.a( 'function' ) );
		} );

		describe( 'shExec', () => {
			it( 'should be defined', () => expect( tools.shExec ).to.be.a( 'function' ) );

			it( 'should execute command (default cwd)', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 0 } );
				const processStub = sandbox.stub( process, 'cwd' ).returns( '/default' );

				tools.shExec( 'command' );

				sinon.assert.calledOnce( processStub );
				sinon.assert.calledOnce( execStub );
				expect( execStub.firstCall.args[ 1 ] ).to.be.an( 'object' );
				expect( execStub.firstCall.args[ 1 ] ).to.contain.property( 'cwd', '/default' );
			} );

			it( 'should execute command with specified cwd', () => {
				const cwd = '/home/user';
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 0 } );

				tools.shExec( 'command', { cwd } );

				sinon.assert.calledOnce( execStub );
				expect( execStub.firstCall.args[ 1 ] ).to.be.an( 'object' );
				expect( execStub.firstCall.args[ 1 ] ).to.contain.property( 'cwd', cwd );
			} );

			it( 'should throw error on unsuccessful call', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 1 } );

				expect( () => {
					tools.shExec( 'command' );
				} ).to.throw();
				sinon.assert.calledOnce( execStub );
			} );

			it( 'should output using log functions when exit code is equal to 0', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 0, stdout: 'out', stderr: 'err' } );

				tools.shExec( 'command' );

				expect( loggerVerbosity ).to.equal( 'info' );
				expect( execStub.calledOnce ).to.equal( true );
				expect( errorSpy.called ).to.equal( false );
				expect( infoSpy.calledTwice ).to.equal( true );
				expect( infoSpy.firstCall.args[ 0 ] ).to.match( /out/ );
				expect( infoSpy.secondCall.args[ 0 ] ).to.match( /err/ );
			} );

			it( 'should output using log functions when exit code is not equal to 0', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 1, stdout: 'out', stderr: 'err' } );

				expect( () => {
					tools.shExec( 'command' );
				} ).to.throw();

				expect( loggerVerbosity ).to.equal( 'info' );
				expect( infoSpy.called ).to.equal( false );
				expect( execStub.calledOnce ).to.equal( true );
				expect( errorSpy.calledTwice ).to.equal( true );
				expect( errorSpy.firstCall.args[ 0 ] ).to.match( /out/ );
				expect( errorSpy.secondCall.args[ 0 ] ).to.match( /err/ );
			} );

			it( 'should not log if no output from executed command', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 0, stdout: '', stderr: '' } );

				tools.shExec( 'command', { verbosity: 'error' } );

				expect( loggerVerbosity ).to.equal( 'error' );
				expect( execStub.calledOnce ).to.equal( true );
				expect( infoSpy.calledOnce ).to.equal( false );
				expect( errorSpy.calledOnce ).to.equal( false );
			} );

			it( 'should return a promise when executing a command in asynchronous mode', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).callsFake( ( command, options, callback ) => {
					callback( 0 );
				} );

				return tools.shExec( 'command', { async: true } )
					.then( () => {
						sinon.assert.calledOnce( execStub );
					} );
			} );

			it( 'should throw error on unsuccessful call in asynchronous mode', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).callsFake( ( command, options, callback ) => {
					callback( 1 );
				} );

				return tools.shExec( 'command', { async: true } )
					.then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							sinon.assert.calledOnce( execStub );
						}
					);
			} );

			it( 'should output using log functions when exit code is equal to 0 in asynchronous mode', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).callsFake( ( command, options, callback ) => {
					callback( 0, 'out', 'err' );
				} );

				return tools.shExec( 'command', { async: true } )
					.then( () => {
						expect( loggerVerbosity ).to.equal( 'info' );
						expect( execStub.calledOnce ).to.equal( true );
						expect( errorSpy.called ).to.equal( false );
						expect( infoSpy.calledTwice ).to.equal( true );
						expect( infoSpy.firstCall.args[ 0 ] ).to.match( /out/ );
						expect( infoSpy.secondCall.args[ 0 ] ).to.match( /err/ );
					} );
			} );

			it( 'should output using log functions when exit code is not equal to 0 in asynchronous mode', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).callsFake( ( command, options, callback ) => {
					callback( 1, 'out', 'err' );
				} );

				return tools.shExec( 'command', { async: true } )
					.then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( loggerVerbosity ).to.equal( 'info' );
							expect( infoSpy.called ).to.equal( false );
							expect( execStub.calledOnce ).to.equal( true );
							expect( errorSpy.calledTwice ).to.equal( true );
							expect( errorSpy.firstCall.args[ 0 ] ).to.match( /out/ );
							expect( errorSpy.secondCall.args[ 0 ] ).to.match( /err/ );
						}
					);
			} );

			it( 'should not log if no output from executed command in asynchronous mode', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).callsFake( ( command, options, callback ) => {
					callback( 0, '', '' );
				} );

				return tools.shExec( 'command', { verbosity: 'error', async: true } )
					.then( () => {
						expect( loggerVerbosity ).to.equal( 'error' );
						expect( execStub.calledOnce ).to.equal( true );
						expect( infoSpy.calledOnce ).to.equal( false );
						expect( errorSpy.calledOnce ).to.equal( false );
					} );
			} );
		} );

		describe( 'getDirectories', () => {
			it( 'should be defined', () => expect( tools.getDirectories ).to.be.a( 'function' ) );

			it( 'should get directories in specified path', () => {
				const fs = require( 'fs' );
				const directories = [ 'dir1', 'dir2', 'dir3' ];
				const readdirSyncStub = sandbox.stub( fs, 'readdirSync' ).returns( directories );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).returns( {
					isDirectory: () => {
						return true;
					}
				} );
				const dirPath = 'path';

				tools.getDirectories( dirPath );

				expect( readdirSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.calledThrice ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path.join( dirPath, directories[ 0 ] ) );
				expect( statSyncStub.secondCall.args[ 0 ] ).to.equal( path.join( dirPath, directories[ 1 ] ) );
				expect( statSyncStub.thirdCall.args[ 0 ] ).to.equal( path.join( dirPath, directories[ 2 ] ) );
			} );
		} );

		describe( 'updateJSONFile', () => {
			it( 'should be defined', () => expect( tools.updateJSONFile ).to.be.a( 'function' ) );
			it( 'should read, update and save JSON file', () => {
				const path = 'path/to/file.json';
				const fs = require( 'fs' );
				const readFileStub = sandbox.stub( fs, 'readFileSync' ).returns( '{}' );
				const modifiedJSON = { modified: true };
				const writeFileStub = sandbox.stub( fs, 'writeFileSync' );

				tools.updateJSONFile( path, () => {
					return modifiedJSON;
				} );

				expect( readFileStub.calledOnce ).to.equal( true );
				expect( readFileStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( writeFileStub.calledOnce ).to.equal( true );
				expect( writeFileStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( writeFileStub.firstCall.args[ 1 ] ).to.equal( JSON.stringify( modifiedJSON, null, 2 ) + '\n' );
			} );
		} );
	} );
} );
