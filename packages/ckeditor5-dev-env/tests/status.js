/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const path = require( 'path' );
const { workspace, git } = require( '@ckeditor/ckeditor5-dev-utils' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-status', () => {
	let statusTask, spies;
	const ckeditor5Path = 'path/to/ckeditor5';
	const workspaceRoot = '..';
	const workspaceAbsolutePath = path.join( ckeditor5Path, workspaceRoot );

	beforeEach( () => {
		spies = {
			loggerInfo: sinon.spy(),
			loggerWarning: sinon.spy(),
			loggerError: sinon.spy()
		};

		statusTask = proxyquire( '../lib/tasks/status', {
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
		for ( let spy in spies ) {
			spy = spies[ spy ];

			if ( spy.restore ) {
				spy.restore();
			}
		}
	} );

	it( 'should show status of dev repositories', () => {
		const dirs = [ 'ckeditor5-core', 'ckeditor5-devtest' ];
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' ).returns( dirs );
		const statusStub = sinon.stub( git, 'getStatus' );
		const json = {
			dependencies: {
				'ckeditor5-core': 'ckeditor/ckeditor5-core',
				'ckeditor5-devtest': 'ckeditor/ckeditor5-devtest#new-branch',
				'other-plugin': '1.2.3'
			}
		};

		statusTask( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		statusStub.restore();

		sinon.assert.calledTwice( statusStub );
		sinon.assert.calledWithExactly( statusStub.firstCall, path.join( workspaceAbsolutePath, dirs[ 0 ] ) );
		sinon.assert.calledWithExactly( statusStub.secondCall, path.join( workspaceAbsolutePath, dirs[ 1 ] ) );
	} );

	it( 'should not get status when no dependencies are found', () => {
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' );
		const statusStub = sinon.stub( git, 'getStatus' );
		const json = {
			dependencies: {
				'other-plugin': '1.2.3'
			}
		};

		statusTask( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		statusStub.restore();

		sinon.assert.notCalled( statusStub );
	} );

	it( 'should not get status when no plugins in dev mode', () => {
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' ).returns( [] );
		const statusStub = sinon.stub( git, 'getStatus' );
		const json = {
			dependencies: {
				'ckeditor5-devtest': 'ckeditor/ckeditor5-devtest#new-branch',
				'other-plugin': '1.2.3'
			}
		};

		statusTask( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		statusStub.restore();

		sinon.assert.notCalled( statusStub );
	} );

	it( 'should write error message when getStatus is unsuccessful', () => {
		const dirs = [ 'ckeditor5-core' ];
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' ).returns( dirs );
		const error = new Error( 'Error message.' );
		const statusStub = sinon.stub( git, 'getStatus' ).throws( error );
		const json = {
			dependencies: {
				'ckeditor5-core': 'ckeditor/ckeditor5-core',
				'ckeditor5-devtest': 'ckeditor/ckeditor5-devtest#new-branch',
				'other-plugin': '1.2.3'
			}
		};

		statusTask( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		statusStub.restore();

		sinon.assert.calledOnce( statusStub );
		sinon.assert.calledOnce( spies.loggerError );
		sinon.assert.calledWithExactly( spies.loggerError, error );
	} );
} );
