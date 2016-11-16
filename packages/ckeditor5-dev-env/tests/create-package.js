/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const path = require( 'path' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const inquiries = require( '../lib/utils/inquiries' );
const { tools, git } = require( '@ckeditor/ckeditor5-dev-utils' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-create-package', () => {
	let packageCreateTask, spies;

	const mainRepositoryPath = '/path/to/repository';
	const workspaceRoot = '..';
	const workspacePath = path.join( mainRepositoryPath, workspaceRoot );
	const packageName = 'package-name';
	const applicationName = 'Full application name';
	const packageVersion = '0.0.1';
	const gitHubPath = 'ckeditor5/package-name';
	const packageDescription = 'Package description.';
	const repositoryPath = path.join( workspacePath, packageName );

	beforeEach( () => {
		createSpies();

		packageCreateTask = proxyquire( '../lib/tasks/create-package', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => {
					return {
						info: spies.loggerInfo,
						warning: spies.loggerWarning,
						error: spies.loggerError
					};
				}
			}
		} );
	} );

	afterEach( () => {
		restoreSpies();
	} );

	function createSpies() {
		spies = {
			linkDirectories: sinon.stub( tools, 'linkDirectories' ),
			shExec: sinon.stub( tools, 'shExec' ),
			getPackageName: sinon.stub( inquiries, 'getPackageName' ).returns( new Promise( ( r ) => r( packageName ) ) ),
			getApplicationName: sinon.stub( inquiries, 'getApplicationName' ).returns( new Promise( ( r ) => r( applicationName ) ) ),
			getPackageVersion: sinon.stub( inquiries, 'getPackageVersion' ).returns( new Promise( ( r ) => r( packageVersion ) ) ),
			getPackageGitHubPath: sinon.stub( inquiries, 'getPackageGitHubPath' ).returns( new Promise( ( r ) => r( gitHubPath ) ) ),
			getPackageDescription: sinon.stub( inquiries, 'getPackageDescription' ).returns( new Promise( ( r ) => r( packageDescription ) ) ),
			initializeRepository: sinon.stub( git, 'initializeRepository' ),
			updateJSONFile: sinon.stub( tools, 'updateJSONFile' ),
			copy: sinon.stub( tools, 'copyTemplateFile' ),
			initialCommit: sinon.stub( git, 'initialCommit' ),
			addRemote: sinon.stub( git, 'addRemote' ),
			loggerInfo: sinon.spy(),
			loggerWarning: sinon.spy(),
			loggerError: sinon.spy()
		};
	}

	function restoreSpies() {
		for ( let spy in spies ) {
			spy = spies[ spy ];

			if ( spy.restore ) {
				spy.restore();
			}
		}
	}

	it( 'should exist', () => expect( packageCreateTask ).to.be.a( 'function' ) );

	it( 'should create a package', () => {
		return packageCreateTask( mainRepositoryPath, workspaceRoot ).then( () => {
			expect( spies.getPackageName.calledOnce ).to.equal( true );
			expect( spies.getApplicationName.calledOnce ).to.equal( true );
			expect( spies.getPackageVersion.calledOnce ).to.equal( true );
			expect( spies.getPackageGitHubPath.calledOnce ).to.equal( true );
			expect( spies.getPackageDescription.calledOnce ).to.equal( true );
			expect( spies.initializeRepository.calledOnce ).to.equal( true );
			expect( spies.initializeRepository.firstCall.args[ 0 ] ).to.equal( repositoryPath );
			expect( spies.addRemote.calledOnce ).to.equal( true );
			expect( spies.addRemote.firstCall.args[ 0 ] ).to.equal( repositoryPath );
			expect( spies.addRemote.firstCall.args[ 1 ] ).to.equal( gitHubPath );
			expect( spies.copy.called ).to.equal( true );
			expect( spies.updateJSONFile.calledTwice ).to.equal( true );
			expect( spies.updateJSONFile.firstCall.args[ 0 ] ).to.equal( path.join( repositoryPath, 'package.json' ) );
			let updateFn = spies.updateJSONFile.firstCall.args[ 1 ];
			let json = updateFn( {} );
			expect( json.name ).to.equal( packageName );
			expect( json.version ).to.equal( packageVersion );
			expect( spies.updateJSONFile.secondCall.args[ 0 ] ).to.equal( path.join( mainRepositoryPath, 'package.json' ) );
			updateFn = spies.updateJSONFile.secondCall.args[ 1 ];
			json = updateFn( {} );
			expect( json.dependencies ).to.be.an( 'object' );
			expect( json.dependencies[ packageName ] ).to.equal( gitHubPath );
			expect( spies.initialCommit.calledOnce ).to.equal( true );
			expect( spies.initialCommit.firstCall.args[ 0 ] ).to.equal( packageName );
			expect( spies.initialCommit.firstCall.args[ 1 ] ).to.equal( repositoryPath );
			expect( spies.linkDirectories.calledOnce ).to.equal( true );
			expect( spies.linkDirectories.firstCall.args[ 0 ] ).to.equal( repositoryPath );
			expect( spies.linkDirectories.firstCall.args[ 1 ] ).to.equal( path.join( mainRepositoryPath, 'node_modules', packageName ) );
			expect( spies.shExec.calledOnce ).to.equal( true );
			expect( spies.shExec.firstCall.args[ 0 ] ).to.match( /^cd [^ ]+ && npm i --save-dev/ );
			expect( spies.loggerInfo.callCount ).to.equal( 7 );
		} );
	} );
} );
