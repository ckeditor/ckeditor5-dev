/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const proxyquire = require( 'proxyquire' );

describe( 'exec-tasks', () => {
	let sandbox, spies, execModuleMocks;
	const config = {
		WORKSPACE_DIR: '/path/exec/'
	};

	const getDevDirectoriesResult = [
		{
			repositoryPath: '/path/1',
			repositoryURL: 'ckeditor/test1'
		},
		{
			repositoryPath: '/path/2',
			repositoryURL: 'ckeditor/test2'
		}
	];

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		sandbox = sinon.sandbox.create();

		spies = {
			loggerInfo: sandbox.spy(),
			loggerWarning: sandbox.spy(),
			loggerError: sandbox.spy()
		};

		execModuleMocks = {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => {
					return {
						info: spies.loggerInfo,
						warning: spies.loggerWarning,
						error: spies.loggerError
					};
				}
			}
		};
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
	} );

	describe( 'execOnRepositories', () => {
		it( 'should throw error when there is no specified task', () => {
			const errorMessage = 'Missing task parameter: --task task-name';

			mockery.registerMock( 'minimist', () => {
				return { };
			} );

			const tasks = proxyquire( '../lib', execModuleMocks )( config );

			tasks.execOnRepositories();

			expect( spies.loggerError.calledOnce ).to.equal( true );
			expect( spies.loggerError.firstCall.args[ 0 ] ).to.be.an( 'error' );
			expect( spies.loggerError.firstCall.args[ 0 ].message ).to.equal( errorMessage );
		} );

		it( 'should throw error when task cannot be found', () => {
			mockery.registerMock( 'minimist', () => {
				return { task: 'task-to-run' };
			} );

			const tasks = proxyquire( '../lib', execModuleMocks )( config );

			tasks.execOnRepositories();

			expect( spies.loggerError.calledOnce ).to.equal( true );
			expect( spies.loggerError.firstCall.args[ 0 ] ).to.be.an( 'error' );
			expect( spies.loggerError.firstCall.args[ 0 ].code ).to.equal( 'MODULE_NOT_FOUND' );
		} );

		it( 'should load task module', () => {
			const { workspace } = require( '@ckeditor/ckeditor5-dev-utils' );

			sandbox.stub( workspace, 'getDevDirectories' ).returns( [] );
			mockery.registerMock( 'minimist', () => {
				return { task: 'task-to-run' };
			} );
			mockery.registerMock( './tasks/exec/functions/task-to-run', () => {} );

			const tasks = proxyquire( '../lib', execModuleMocks )( config );

			tasks.execOnRepositories();

			expect( spies.loggerError.called ).to.equal( false );
		} );

		it( 'should log error when task is throwing exceptions', () => {
			const devUtils = require( '@ckeditor/ckeditor5-dev-utils' );

			const taskStub = sinon.stub();
			taskStub.onSecondCall().throws();

			sandbox.stub( devUtils.workspace, 'getDevDirectories' ).returns( getDevDirectoriesResult );
			sandbox.stub( devUtils, 'logger' ).returns( execModuleMocks[ '@ckeditor/ckeditor5-dev-utils' ].logger() );
			mockery.registerMock( 'minimist', () => {
				return { task: 'task-to-run' };
			} );
			mockery.registerMock( './tasks/exec/functions/task-to-run', taskStub );

			const tasks = proxyquire( '../lib', execModuleMocks )( config );

			tasks.execOnRepositories();

			expect( spies.loggerError.calledOnce ).to.equal( true );
			expect( spies.loggerError.firstCall.args[ 0 ] ).to.be.an( 'error' );
			expect( taskStub.calledTwice ).to.equal( true );
			expect( taskStub.firstCall.args[ 0 ] ).to.equal( '/path/1' );
			expect( taskStub.firstCall.args[ 1 ] ).to.deep.equal( { task: 'task-to-run' } );
			expect( taskStub.secondCall.args[ 0 ] ).to.equal( '/path/2' );
			expect( taskStub.secondCall.args[ 1 ] ).to.deep.equal( { task: 'task-to-run' } );
		} );

		it( 'should execute task over directories', () => {
			const devUtils = require( '@ckeditor/ckeditor5-dev-utils' );
			const taskStub = sinon.stub();

			mockery.registerMock( 'minimist', () => {
				return { task: 'task-to-run' };
			} );
			sandbox.stub( devUtils.workspace, 'getDevDirectories' ).returns( getDevDirectoriesResult );
			sandbox.stub( devUtils, 'logger' ).returns( execModuleMocks[ '@ckeditor/ckeditor5-dev-utils' ].logger() );
			mockery.registerMock( './tasks/exec/functions/task-to-run', taskStub );

			const tasks = proxyquire( '../lib', execModuleMocks )( config );

			tasks.execOnRepositories();

			expect( taskStub.calledTwice ).to.equal( true );
			expect( taskStub.firstCall.args[ 0 ] ).to.equal( '/path/1' );
			expect( taskStub.firstCall.args[ 1 ] ).to.deep.equal( { task: 'task-to-run' } );
			expect( taskStub.secondCall.args[ 0 ] ).to.equal( '/path/2' );
			expect( taskStub.secondCall.args[ 1 ] ).to.deep.equal( { task: 'task-to-run' } );
		} );

		it( 'should execute task over specific directory', () => {
			const Stream = require( 'stream' );
			const devUtils = require( '@ckeditor/ckeditor5-dev-utils' );
			const taskStub = sinon.stub().returns( new Stream() );

			mockery.registerMock( 'minimist', () => {
				return {
					task: 'task-to-run',
					repository: 'test1'
				};
			} );
			sandbox.stub( devUtils.workspace, 'getDevDirectories' ).returns( getDevDirectoriesResult );
			sandbox.stub( devUtils, 'logger' ).returns( execModuleMocks[ '@ckeditor/ckeditor5-dev-utils' ].logger() );
			mockery.registerMock( './tasks/exec/functions/task-to-run', taskStub );

			const tasks = proxyquire( '../lib', execModuleMocks )( config );

			tasks.execOnRepositories();

			expect( taskStub.calledOnce ).to.equal( true );
			expect( taskStub.firstCall.args[ 0 ] ).to.equal( '/path/1' );
			expect( taskStub.firstCall.args[ 1 ] ).to.deep.equal( { task: 'task-to-run', repository: 'test1' } );
		} );
	} );
} );
