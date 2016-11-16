/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const path = require( 'path' );
const { tools, workspace } = require( '@ckeditor/ckeditor5-dev-utils' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-relink', () => {
	let spies, task;
	const ckeditor5Path = 'path/to/ckeditor5';
	const modulesPath = path.join( ckeditor5Path, 'node_modules' );
	const workspaceRoot = '..';
	const workspaceAbsolutePath = path.join( ckeditor5Path, workspaceRoot );

	beforeEach( () => {
		spies = {
			loggerInfo: sinon.spy(),
			loggerWarning: sinon.spy(),
			loggerError: sinon.spy()
		};

		task = proxyquire( '../lib/tasks/relink', {
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

	it( 'should link dev repositories', () => {
		const dirs = [ 'ckeditor5-core', 'ckeditor5-devtest' ];
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' ).returns( dirs );
		const linkStub = sinon.stub( tools, 'linkDirectories' );
		const json = {
			dependencies: {
				'ckeditor5-core': 'ckeditor/ckeditor5-core',
				'ckeditor5-devtest': 'ckeditor/ckeditor5-devtest#new-branch',
				'other-plugin': '1.2.3'
			}
		};

		task( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		linkStub.restore();

		sinon.assert.calledTwice( linkStub );
		sinon.assert.calledWithExactly( linkStub.firstCall, path.join( workspaceAbsolutePath, dirs[ 0 ] ), path.join( modulesPath, dirs[ 0 ] ) );
		sinon.assert.calledWithExactly( linkStub.secondCall, path.join( workspaceAbsolutePath, dirs[ 1 ] ), path.join( modulesPath, dirs[ 1 ] ) );
	} );

	it( 'should not link when no dependencies are found', () => {
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' );
		const linkStub = sinon.stub( tools, 'linkDirectories' );
		const json = {
			dependencies: {
				'other-plugin': '1.2.3'
			}
		};

		task( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		linkStub.restore();

		sinon.assert.notCalled( linkStub );
	} );

	it( 'should not link when no plugins in dev mode', () => {
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' ).returns( [] );
		const linkStub = sinon.stub( tools, 'linkDirectories' );
		const json = {
			dependencies: {
				'ckeditor5-devtest': 'ckeditor/ckeditor5-devtest#new-branch',
				'other-plugin': '1.2.3'
			}
		};

		task( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		linkStub.restore();

		sinon.assert.notCalled( linkStub );
	} );

	it( 'should write error message when linking is unsuccessful', () => {
		const dirs = [ 'ckeditor5-core' ];
		const getDependenciesSpy = sinon.spy( workspace, 'getDependencies' );
		const getDirectoriesStub = sinon.stub( workspace, 'getDirectories' ).returns( dirs );
		const error = new Error( 'Error message.' );
		const linkStub = sinon.stub( tools, 'linkDirectories' ).throws( error );
		const json = {
			dependencies: {
				'ckeditor5-core': 'ckeditor/ckeditor5-core',
				'ckeditor5-devtest': 'ckeditor/ckeditor5-devtest#new-branch',
				'other-plugin': '1.2.3'
			}
		};

		task( ckeditor5Path, json, workspaceRoot );

		getDependenciesSpy.restore();
		getDirectoriesStub.restore();
		linkStub.restore();

		sinon.assert.calledOnce( linkStub );
		sinon.assert.calledOnce( spies.loggerError );
		sinon.assert.calledWithExactly( spies.loggerError, error );
	} );
} );
