/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const { workspace: workspaceUtils } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'executeOnDependencies()', () => {
		let executeOnDependencies, sandbox, getPackageJsonStub;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			getPackageJsonStub = sandbox.stub();

			executeOnDependencies = proxyquire( '../../../lib/release-tools/utils/executeondependencies', {
				'@ckeditor/ckeditor5-dev-utils': {
					workspace: workspaceUtils
				},
				'./getpackagejson': getPackageJsonStub
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'resolves promsie when package list is empty', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			const getDirectoriesStub = sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [] );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/',
				skipPackages: [],
				checkPackageJson: true
			};

			return executeOnDependencies( options, functionToExecute )
				.then( () => {
					expect( getDirectoriesStub.calledOnce ).to.equal( true );
					expect( functionToExecute.called ).to.equal( false );
				} );
		} );

		it( 'executes a function for each package found as a dependency in package.json in CWD', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			const getDirectoriesStub = sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine', 'ckeditor5-utils' ] );

			getPackageJsonStub.onFirstCall().returns( {
				dependencies: {
					'ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine'
				}
			} );
			getPackageJsonStub.onSecondCall().returns( { name: 'ckeditor5-core' } );
			getPackageJsonStub.onThirdCall().returns( { name: '@ckeditor/ckeditor5-engine' } );
			getPackageJsonStub.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-utils' } );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/',
				skipPackages: [],
				checkPackageJson: true
			};

			const packagesPath = path.join( options.cwd, options.packages );

			return executeOnDependencies( options, functionToExecute )
				.then( () => {
					expect( getDirectoriesStub.calledOnce ).to.equal( true );
					expect( getPackageJsonStub.callCount ).to.equal( 4 );
					expect( getPackageJsonStub.firstCall.args[ 0 ] ).to.equal( options.cwd );

					expect( functionToExecute.calledTwice ).to.equal( true );
					expect( functionToExecute.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-core' );
					expect( functionToExecute.firstCall.args[ 1 ] ).to.equal( path.join( packagesPath, 'ckeditor5-core' ) );
					expect( functionToExecute.secondCall.args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
					expect( functionToExecute.secondCall.args[ 1 ] ).to.equal( path.join( packagesPath, 'ckeditor5-engine' ) );
				} );
		} );

		it( 'waits for each callback', () => {
			const order = [];

			function functionToExecute( dependency ) {
				return new Promise( ( resolve ) => {
					order.push( dependency + '-started' );

					setTimeout( () => {
						order.push( dependency + '-resolved' );
						resolve();
					} );
				} );
			}

			sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			getPackageJsonStub.onFirstCall().returns( {
				dependencies: {
					'ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine'
				}
			} );
			getPackageJsonStub.onSecondCall().returns( { name: 'ckeditor5-core' } );
			getPackageJsonStub.onThirdCall().returns( { name: '@ckeditor/ckeditor5-engine' } );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/',
				skipPackages: [],
				checkPackageJson: true
			};

			return executeOnDependencies( options, functionToExecute )
				.then( () => {
					expect( order ).to.deep.equal( [
						'ckeditor5-core-started',
						'ckeditor5-core-resolved',
						'@ckeditor/ckeditor5-engine-started',
						'@ckeditor/ckeditor5-engine-resolved'
					] );
				} );
		} );

		it( 'does not execute a function for specified packages', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			getPackageJsonStub.onFirstCall().returns( {
				dependencies: {
					'ckeditor5-core': 'ckeditor/ckeditor5-core',
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine'
				}
			} );
			getPackageJsonStub.onSecondCall().returns( { name: 'ckeditor5-core' } );
			getPackageJsonStub.onThirdCall().returns( { name: '@ckeditor/ckeditor5-engine' } );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/',
				skipPackages: [
					'ckeditor5-core'
				],
				checkPackageJson: true
			};

			return executeOnDependencies( options, functionToExecute )
				.then( ( skipedDependencies ) => {
					const enginePath = path.join( options.cwd, options.packages, 'ckeditor5-core' );

					expect( skipedDependencies ).to.deep.equal( options.skipPackages );
					expect( functionToExecute.calledOnce ).to.equal( true );
					expect( functionToExecute.neverCalledWith( 'ckeditor5-core', enginePath ) ).to.equal( true );
				} );
		} );

		it( 'allows disabling checking whether the package is specified in "package.json"', () => {
			const functionToExecute = sandbox.stub().returns( Promise.resolve() );

			sandbox.stub( workspaceUtils, 'getDirectories' )
				.returns( [ 'ckeditor5-core', 'ckeditor5-engine' ] );

			getPackageJsonStub.onFirstCall().returns( {
				dependencies: {
					'@ckeditor/ckeditor5-engine': 'ckeditor/ckeditor5-engine'
				}
			} );
			getPackageJsonStub.onSecondCall().returns( { name: 'ckeditor5-core' } );
			getPackageJsonStub.onThirdCall().returns( { name: '@ckeditor/ckeditor5-engine' } );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures', 'basic' ),
				packages: 'packages/',
				skipPackages: [],
				checkPackageJson: false
			};

			const packagesPath = path.join( options.cwd, options.packages );

			return executeOnDependencies( options, functionToExecute )
				.then( ( skipedDependencies ) => {
					expect( skipedDependencies ).to.deep.equal( [] );

					expect( functionToExecute.calledTwice ).to.equal( true );
					expect( functionToExecute.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-core' );
					expect( functionToExecute.firstCall.args[ 1 ] ).to.equal( path.join( packagesPath, 'ckeditor5-core' ) );
					expect( functionToExecute.secondCall.args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
					expect( functionToExecute.secondCall.args[ 1 ] ).to.equal( path.join( packagesPath, 'ckeditor5-engine' ) );
				} );
		} );
	} );
} );
