/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const tools = require( '../lib/tools' );
const path = require( 'path' );
const fs = require( 'fs' );
const mockery = require( 'mockery' );

describe( 'utils', () => {
	let sandbox, infoSpy, errorSpy, loggerVerbosity;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
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
		describe( 'shExec', () => {
			it( 'should be defined', () => expect( tools.shExec ).to.be.a( 'function' ) );

			it( 'should execute command', () => {
				const sh = require( 'shelljs' );
				const execStub = sandbox.stub( sh, 'exec' ).returns( { code: 0 } );

				tools.shExec( 'command' );

				sinon.assert.calledOnce( execStub );
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
		} );

		describe( 'linkDirectories', () => {
			it( 'should be defined', () => expect( tools.linkDirectories ).to.be.a( 'function' ) );

			it( 'should link directories', () => {
				const isSymlinkStub = sandbox.stub( tools, 'isSymlink' ).returns( false );
				const isDirectoryStub = sandbox.stub( tools, 'isDirectory' ).returns( false );
				const symlinkStub = sandbox.stub( fs, 'symlinkSync' );
				const source = '/source/dir';
				const destination = '/destination/dir';

				tools.linkDirectories( source, destination );

				expect( isDirectoryStub.calledOnce ).to.equal( true );
				expect( isSymlinkStub.calledOnce ).to.equal( true );
				expect( symlinkStub.calledOnce ).to.equal( true );
				expect( symlinkStub.firstCall.args[ 0 ] ).to.equal( source );
				expect( symlinkStub.firstCall.args[ 1 ] ).to.equal( destination );
			} );

			it( 'should remove destination directory before linking', () => {
				const shExecStub = sandbox.stub( tools, 'shExec' );
				const isSymlinkStub = sandbox.stub( tools, 'isSymlink' ).returns( false );
				const isDirectoryStub = sandbox.stub( tools, 'isDirectory' ).returns( true );
				const symlinkStub = sandbox.stub( fs, 'symlinkSync' );
				const source = '/source/dir';
				const destination = '/destination/dir';

				tools.linkDirectories( source, destination );

				expect( isDirectoryStub.calledOnce ).to.equal( true );
				expect( isSymlinkStub.calledOnce ).to.equal( true );
				expect( shExecStub.calledOnce ).to.equal( true );
				expect( symlinkStub.firstCall.args[ 0 ] ).to.equal( source );
				expect( symlinkStub.firstCall.args[ 1 ] ).to.equal( destination );
			} );

			it( 'should unlink destination directory if symlink', () => {
				const shExecStub = sandbox.stub( tools, 'shExec' );
				const isSymlinkStub = sandbox.stub( tools, 'isSymlink' ).returns( true );
				const removeSymlinkStub = sandbox.stub( tools, 'removeSymlink' );
				const isDirectoryStub = sandbox.stub( tools, 'isDirectory' ).returns( true );
				const symlinkStub = sandbox.stub( fs, 'symlinkSync' );
				const source = '/source/dir';
				const destination = '/destination/dir';

				tools.linkDirectories( source, destination );

				expect( isDirectoryStub.notCalled ).to.equal( true );
				expect( isSymlinkStub.calledOnce ).to.equal( true );
				expect( shExecStub.notCalled ).to.equal( true );
				expect( removeSymlinkStub.calledOnce ).to.equal( true );
				expect( removeSymlinkStub.firstCall.args[ 0 ] ).to.equal( destination );
				expect( symlinkStub.firstCall.args[ 0 ] ).to.equal( source );
				expect( symlinkStub.firstCall.args[ 1 ] ).to.equal( destination );
			} );
		} );

		describe( 'getDirectories', () => {
			it( 'should be defined', () => expect( tools.getDirectories ).to.be.a( 'function' ) );

			it( 'should get directories in specified path', () => {
				const fs = require( 'fs' );
				const directories = [ 'dir1', 'dir2', 'dir3' ];
				const readdirSyncStub = sandbox.stub( fs, 'readdirSync' ).returns( directories );
				const isDirectoryStub = sandbox.stub( tools, 'isDirectory' ).returns( true );
				const dirPath = 'path';

				tools.getDirectories( dirPath );

				expect( readdirSyncStub.calledOnce ).to.equal( true );
				expect( isDirectoryStub.calledThrice ).to.equal( true );
				expect( isDirectoryStub.firstCall.args[ 0 ] ).to.equal( path.join( dirPath, directories[ 0 ] ) );
				expect( isDirectoryStub.secondCall.args[ 0 ] ).to.equal( path.join( dirPath, directories[ 1 ] ) );
				expect( isDirectoryStub.thirdCall.args[ 0 ] ).to.equal( path.join( dirPath, directories[ 2 ] ) );
			} );
		} );

		describe( 'isDirectory', () => {
			it( 'should be defined', () => expect( tools.isDirectory ).to.be.a( 'function' ) );

			it( 'should return true if path points to directory', () => {
				const fs = require( 'fs' );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).returns( { isDirectory: () => true } );
				const path = 'path';

				const result = tools.isDirectory( path );

				expect( statSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( result ).to.equal( true );
			} );

			it( 'should return false if path does not point to directory', () => {
				const fs = require( 'fs' );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).returns( { isDirectory: () => false } );
				const path = 'path';

				const result = tools.isDirectory( path );

				expect( statSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( result ).to.equal( false );
			} );

			it( 'should return false if statSync method throws', () => {
				const fs = require( 'fs' );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).throws();
				const path = 'path';

				const result = tools.isDirectory( path );

				expect( statSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( result ).to.equal( false );
			} );
		} );

		describe( 'isFile', () => {
			it( 'should be defined', () => expect( tools.isFile ).to.be.a( 'function' ) );

			it( 'should return true if path points to file', () => {
				const fs = require( 'fs' );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).returns( { isFile: () => true } );
				const path = 'path';

				const result = tools.isFile( path );

				expect( statSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( result ).to.equal( true );
			} );

			it( 'should return false if path does not point to directory', () => {
				const fs = require( 'fs' );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).returns( { isFile: () => false } );
				const path = 'path';

				const result = tools.isFile( path );

				expect( statSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( result ).to.equal( false );
			} );

			it( 'should return false if statSync method throws', () => {
				const fs = require( 'fs' );
				const statSyncStub = sandbox.stub( fs, 'statSync' ).throws();
				const path = 'path';

				const result = tools.isFile( path );

				expect( statSyncStub.calledOnce ).to.equal( true );
				expect( statSyncStub.firstCall.args[ 0 ] ).to.equal( path );
				expect( result ).to.equal( false );
			} );
		} );

		describe( 'isSymlink', () => {
			it( 'should return true if path points to symbolic link', () => {
				const path = 'path/to/file';
				const fs = require( 'fs' );
				sandbox.stub( fs, 'lstatSync' ).returns( {
					isSymbolicLink: () => true
				} );

				expect( tools.isSymlink( path ) ).to.equal( true );
			} );

			it( 'should return false if lstatSync throws', () => {
				const path = 'path/to/file';
				const fs = require( 'fs' );
				sandbox.stub( fs, 'lstatSync' ).throws();

				expect( tools.isSymlink( path ) ).to.equal( false );
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

		describe( 'sortObject', () => {
			it( 'should be defined', () => expect( tools.sortObject ).to.be.a( 'function' ) );
			it( 'should reinsert object properties in alphabetical order', () => {
				let obj = {
					c: '', d: '', a: '', z: ''
				};

				const sorted = {
					a: '', c: '', d: '', z: ''
				};

				obj = tools.sortObject( obj );

				expect( JSON.stringify( obj ) ).to.equal( JSON.stringify( sorted ) );
			} );
		} );

		describe( 'readPackageName', () => {
			const modulePath = 'path/to/module';
			it( 'should read package name from NPM module', () => {
				sandbox.stub( tools, 'isFile' ).returns( true );
				const fs = require( 'fs' );
				const name = 'module-name';
				sandbox.stub( fs, 'readFileSync' ).returns( JSON.stringify( { name } ) );

				const result = tools.readPackageName( modulePath );

				expect( result ).to.equal( name );
			} );

			it( 'should return null if no package.json is found', () => {
				sandbox.stub( tools, 'isFile' ).returns( false );

				const result = tools.readPackageName( modulePath );

				expect( result ).to.equal( null );
			} );

			it( 'should return null if no name in package.json is provided', () => {
				sandbox.stub( tools, 'isFile' ).returns( true );
				const fs = require( 'fs' );
				sandbox.stub( fs, 'readFileSync' ).returns( JSON.stringify( {} ) );

				const result = tools.readPackageName( modulePath );

				expect( result ).to.equal( null );
			} );
		} );

		describe( 'npmInstall', () => {
			it( 'should be defined', () => expect( tools.npmInstall ).to.be.a( 'function' ) );
			it( 'should execute npm install command', () => {
				const shExecStub = sandbox.stub( tools, 'shExec' );
				const path = '/path/to/repository';

				tools.npmInstall( path );

				expect( shExecStub.calledOnce ).to.equal( true );
				expect( shExecStub.firstCall.args[ 0 ] ).to.equal( `cd ${ path } && npm install` );
			} );
		} );

		describe( 'npmUpdate', () => {
			it( 'should be defined', () => expect( tools.npmUpdate ).to.be.a( 'function' ) );
			it( 'should execute npm update command', () => {
				const shExecStub = sandbox.stub( tools, 'shExec' );
				const path = '/path/to/repository';

				tools.npmUpdate( path );

				expect( shExecStub.calledOnce ).to.equal( true );
				expect( shExecStub.firstCall.args[ 0 ] ).to.equal( `cd ${ path } && npm update --dev` );
			} );
		} );

		describe( 'npmUninstall', () => {
			it( 'should be defined', () => expect( tools.npmUninstall ).to.be.a( 'function' ) );
			it( 'should execute npm uninstall command', () => {
				const shExecStub = sandbox.stub( tools, 'shExec' );
				const path = '/path/to/repository';
				const moduleName = 'module-name';

				tools.npmUninstall( path, moduleName );

				expect( shExecStub.calledOnce ).to.equal( true );
				expect( shExecStub.firstCall.args[ 0 ] ).to.equal( `cd ${ path } && npm uninstall ${ moduleName }` );
			} );
		} );

		describe( 'copyTemplateFile', () => {
			it( 'should be defined', () => expect( tools.copyTemplateFile ).to.be.a( 'function' ) );

			it( 'should copy files and replace provided texts', () => {
				const path = require( 'path' );
				const fs = require( 'fs-extra' );
				const inputPath = '/path/to/file1.md';
				const outputPath = '/path/to/file2.md';

				const readFileStub = sandbox.stub( fs, 'readFileSync' );
				const writeFileStub = sandbox.stub( fs, 'writeFileSync' );
				const ensureDirStub = sandbox.stub( fs, 'ensureDirSync' );

				readFileStub.onFirstCall().returns( 'file data {{var1}}, {{var2}}' );

				tools.copyTemplateFile( inputPath, outputPath, {
					'{{var1}}': 'foo',
					'{{var2}}': 'bar'
				} );

				sinon.assert.calledWithExactly( ensureDirStub, path.dirname( outputPath ) );
				sinon.assert.calledOnce( readFileStub );
				sinon.assert.calledWithExactly( readFileStub.firstCall, inputPath, 'utf8' );
				sinon.assert.calledOnce( writeFileStub );
				sinon.assert.calledWithExactly( writeFileStub.firstCall, outputPath, 'file data foo, bar', 'utf8' );
			} );

			it( 'should copy files if no replace object is provided', () => {
				const path = require( 'path' );
				const fs = require( 'fs-extra' );
				const inputPath = '/path/to/file1.md';
				const outputPath = '/path/to/file2.md';
				const copyFileStub = sandbox.stub( fs, 'copySync' );
				const ensureDirStub = sandbox.stub( fs, 'ensureDirSync' );

				tools.copyTemplateFile( inputPath, outputPath );

				sinon.assert.calledWithExactly( ensureDirStub, path.dirname( outputPath ) );
				sinon.assert.calledOnce( copyFileStub );
				sinon.assert.calledWithExactly( copyFileStub.firstCall, inputPath, outputPath );
			} );
		} );

		describe( 'getGitUrlFromNpm', () => {
			const repository = {
				type: 'git',
				url: 'git@github.com:ckeditor/ckeditor5-core'
			};
			const moduleName = 'ckeditor5-core';

			it( 'should be defined', () => expect( tools.getGitUrlFromNpm ).to.be.a( 'function' ) );
			it( 'should call npm view command', () => {
				const shExecStub = sandbox.stub( tools, 'shExec' ).returns( JSON.stringify( repository ) );
				const url = tools.getGitUrlFromNpm( moduleName );

				expect( shExecStub.calledOnce ).to.equal( true );
				expect( shExecStub.firstCall.args[ 0 ] ).to.equal( `npm view ${ moduleName } repository --json` );
				expect( url ).to.equal( repository.url );
			} );

			it( 'should return null if module is not found', () => {
				sandbox.stub( tools, 'shExec' ).throws( new Error( 'npm ERR! code E404' ) );
				const url = tools.getGitUrlFromNpm( moduleName );
				expect( url ).to.equal( null );
			} );

			it( 'should return null if module has no repository information', () => {
				sandbox.stub( tools, 'shExec' ).returns( JSON.stringify( {} ) );
				const url = tools.getGitUrlFromNpm( moduleName );
				expect( url ).to.equal( null );
			} );

			it( 'should throw on other errors', () => {
				const error = new Error( 'Random error.' );
				sandbox.stub( tools, 'shExec' ).throws( error );
				const getUrlSpy = sandbox.spy( tools, 'getGitUrlFromNpm' );

				try {
					tools.getGitUrlFromNpm( moduleName );
				} catch ( e ) {
					expect( e ).to.equal( error );
				}

				expect( getUrlSpy.threw( error ) ).to.equal( true );
			} );
		} );

		describe( 'removeSymlink', () => {
			it( 'should unlink provided symlink', () => {
				const fs = require( 'fs' );
				const unlinkStub = sandbox.stub( fs, 'unlinkSync' );
				const path = 'path/to/symlink';

				tools.removeSymlink( path );

				expect( unlinkStub.calledOnce ).to.equal( true );
				expect( unlinkStub.firstCall.args[ 0 ] ).to.equal( path );
			} );
		} );

		describe( 'copyFile', () => {
			const fs = require( 'fs-extra' );

			it( 'rejects Promise when file does not exist', () => {
				const readFileStub = sandbox.stub( fs, 'readFile' ).callsFake( ( from, to, callback ) => {
					callback( 'Some error during readFile.' );
				} );

				return tools.copyFile( '/tmp/not/existing/file.txt', '/tmp/file.txt' )
					.catch( err => {
						expect( readFileStub.calledOnce ).to.equal( true );
						expect( readFileStub.firstCall.args[ 0 ] ).to.equal( '/tmp/not/existing/file.txt' );
						expect( err ).to.equal( 'Some error during readFile.' );
					} );
			} );

			it( 'rejects Promise when file cannot be saved', () => {
				const readFileStub = sandbox.stub( fs, 'readFile' ).callsFake( ( from, to, callback ) => {
					callback( null, 'Some data.' );
				} );

				const outputFileStub = sandbox.stub( fs, 'outputFile' ).callsFake( ( to, data, callback ) => {
					callback( 'Some error during outputFile.' );
				} );

				return tools.copyFile( '/tmp/directory/file.txt', '/tmp/file.txt' )
					.catch( err => {
						expect( readFileStub.calledOnce ).to.equal( true );
						expect( readFileStub.firstCall.args[ 0 ] ).to.equal( '/tmp/directory/file.txt' );
						expect( outputFileStub.calledOnce ).to.equal( true );
						expect( outputFileStub.firstCall.args[ 0 ] ).to.equal( '/tmp/file.txt' );
						expect( outputFileStub.firstCall.args[ 1 ] ).to.equal( 'Some data.' );

						expect( err ).to.equal( 'Some error during outputFile.' );
					} );
			} );

			it( 'resolves Promise when file was copied', () => {
				const readFileStub = sandbox.stub( fs, 'readFile' ).callsFake( ( from, to, callback ) => {
					callback( null, 'Some data.' );
				} );

				const outputFileStub = sandbox.stub( fs, 'outputFile' ).callsFake( ( to, data, callback ) => {
					callback( null );
				} );

				return tools.copyFile( '/tmp/directory/file.txt', '/tmp/file.txt' )
					.then( () => {
						expect( readFileStub.calledOnce ).to.equal( true );
						expect( readFileStub.firstCall.args[ 0 ] ).to.equal( '/tmp/directory/file.txt' );
						expect( outputFileStub.calledOnce ).to.equal( true );
						expect( outputFileStub.firstCall.args[ 0 ] ).to.equal( '/tmp/file.txt' );
						expect( outputFileStub.firstCall.args[ 1 ] ).to.equal( 'Some data.' );
					} );
			} );
		} );

		describe( 'clean', () => {
			const files = [
				path.join( 'test', 'foo', 'bar' ),
				path.join( 'test', 'bar', 'foo' )
			];

			let delArg;

			beforeEach( () => {
				mockery.registerMock( 'del', globToDelete => {
					delArg = globToDelete;

					return Promise.resolve( files );
				} );
			} );

			it( 'removes files and informs about deletion using a logger', () => {
				return tools.clean( 'test', '**' )
					.then( () => {
						expect( delArg ).to.equal( path.join( 'test', '**' ) );
						expect( loggerVerbosity ).to.equal( 'info' );
						expect( infoSpy.calledTwice ).to.equal( true );
						expect( infoSpy.firstCall.args[ 0 ] ).to.match( new RegExp( files[ 0 ] ) );
						expect( infoSpy.secondCall.args[ 0 ] ).to.match( new RegExp( files[ 1 ] ) );
					} );
			} );
		} );
	} );
} );
