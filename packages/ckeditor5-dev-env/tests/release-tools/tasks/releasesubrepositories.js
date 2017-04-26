/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	let releaseSubRepositories, sandbox, stubs, packagesToRelease;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		packagesToRelease = new Map();

		stubs = {
			cli: {
				confirmRelease: sandbox.stub(),
				configureReleaseOptions: sandbox.stub(),
			},
			validator: {
				checkBranch: sandbox.stub(),
			},
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			getPackagesToRelease: sandbox.stub(),
			displaySkippedPackages: sandbox.stub(),
			releaseRepository: sandbox.stub(),
			getPackageJson: sandbox.stub(),
			getSubRepositoriesPaths: sandbox.stub()
		};

		mockery.registerMock( '../utils/executeonpackages', ( pathsToPackages, functionToExecute ) => {
			let promise = Promise.resolve();

			for ( const repositoryPath of pathsToPackages ) {
				promise = promise.then( () => functionToExecute( repositoryPath ) );
			}

			return promise;
		} );

		mockery.registerMock( './releaserepository', stubs.releaseRepository );
		mockery.registerMock( '../utils/getpackagejson', stubs.getPackageJson );
		mockery.registerMock( '../utils/displayskippedpackages', stubs.displaySkippedPackages );
		mockery.registerMock( '../utils/getpackagestorelease', stubs.getPackagesToRelease );
		mockery.registerMock( '../utils/getsubrepositoriespaths', stubs.getSubRepositoriesPaths );
		mockery.registerMock( '../utils/cli', stubs.cli );
		mockery.registerMock( '../utils/releasevalidator', stubs.validator );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

		releaseSubRepositories = proxyquire( '../../../lib/release-tools/tasks/releasesubrepositories', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'releaseSubRepositories()', () => {
		it( 'executes "releaseRepository" function on each package', () => {
			const chdirStub = sandbox.stub( process, 'chdir' );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', {
				version: '0.6.0',
				hasChangelog: true
			} );
			packagesToRelease.set( '@ckeditor/ckeditor5-engine', {
				version: '1.0.1',
				hasChangelog: true
			} );

			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onSecondCall().returns( { name: '@ckeditor/ckeditor5-engine' } );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-engine'
				] )
			} );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipGithub: false,
				skipNpm: true,
				token: 'secret-token-to-github-account'
			} ) );
			stubs.validator.checkBranch.returns( undefined );

			const options = {
				cwd: '/tmp',
				packages: 'packages'
			};

			return releaseSubRepositories( options )
				.then( () => {
					expect( chdirStub.called ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-engine' );

					expect( stubs.releaseRepository.calledTwice ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.calledOnce ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						skipPackages: []
					} );

					const releaseArguments = {
						skipGithub: false,
						skipNpm: true,
						token: 'secret-token-to-github-account',
						dependencies: packagesToRelease
					};

					expect( stubs.releaseRepository.firstCall.args[ 0 ] ).to.deep.equal( releaseArguments );
					expect( stubs.releaseRepository.secondCall.args[ 0 ] ).to.deep.equal( releaseArguments );
				} );
		} );

		it( 'does not release anything when list with packages to release is empty', () => {
			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-engine'
				] )
			} );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			return releaseSubRepositories( options )
				.then( () => {
					const expectedError = 'None of the packages contains any changes since its last release. Aborting.';

					expect( stubs.releaseRepository.called ).to.equal( false );
					expect( stubs.logger.error.calledOnce ).to.equal( true );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( expectedError );
				} );
		} );

		it( 'does not release anything when packages are not prepared for the release', () => {
			sandbox.stub( process, 'chdir' );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', {
				version: '0.6.0',
				hasChangelog: true
			} );
			packagesToRelease.set( '@ckeditor/ckeditor5-engine', {
				version: '1.0.1',
				hasChangelog: true
			} );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-engine'
				] )
			} );

			stubs.getPackageJson.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			stubs.getPackageJson.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-engine' } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );
			stubs.validator.checkBranch.throws( new Error( 'Not on master or master is not clean.' ) );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.releaseRepository.called ).to.equal( false );
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Releasing has been aborted due to errors.' );
					expect( stubs.logger.error.getCall( 1 ).args[ 0 ] ).to.equal( '## @ckeditor/ckeditor5-core' );
					expect( stubs.logger.error.getCall( 2 ).args[ 0 ] ).to.equal( 'Not on master or master is not clean.' );
					expect( stubs.logger.error.getCall( 3 ).args[ 0 ] ).to.equal( '## @ckeditor/ckeditor5-engine' );
					expect( stubs.logger.error.getCall( 4 ).args[ 0 ] ).to.equal( 'Not on master or master is not clean.' );
				} );
		} );

		it( 'does not release anything when user aborted', () => {
			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core'
				] )
			} );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', {
				version: '0.6.0',
				hasChangelog: true
			} );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( false ) );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.releaseRepository.called ).to.equal( false );
				} );
		} );

		it( 'breaks the whole process when unexpected error occurs', () => {
			const error = new Error( 'Unexpected error.' );

			sandbox.stub( process, 'chdir' );

			stubs.releaseRepository.onFirstCall().returns( Promise.resolve() );
			stubs.releaseRepository.onSecondCall().throws( error );

			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipGithub: true,
				skipNpm: true
			} ) );

			stubs.validator.checkBranch.returns( undefined );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', {
				version: '0.6.0',
				hasChangelog: true
			} );
			packagesToRelease.set( '@ckeditor/ckeditor5-engine', {
				version: '1.0.0',
				hasChangelog: true
			} );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-engine'
				] )
			} );

			stubs.getPackageJson.onCall( 0 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onCall( 1 ).returns( { name: '@ckeditor/ckeditor5-engine' } );
			stubs.getPackageJson.onCall( 2 ).returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onCall( 3 ).returns( { name: '@ckeditor/ckeditor5-engine' } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			return releaseSubRepositories( options )
				.then( () => {
					expect( process.exitCode ).to.equal( -1 );
					expect( stubs.releaseRepository.calledTwice ).to.equal( true );
					expect( stubs.logger.error.calledOnce ).to.equal( true );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( error.message );
				} );
		} );

		it( 'does not release specified packages', () => {
			sandbox.stub( process, 'chdir' );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );
			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve() );
			stubs.validator.checkBranch.returns( undefined );

			const options = {
				cwd: __dirname,
				packages: 'packages/',
				skipPackages: [
					'@ckeditor/ckeditor5-engine'
				]
			};

			const skippedPackages = new Set( [
				'@ckeditor/ckeditor5-engine'
			] );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: skippedPackages,
				packages: new Set( [
					'/tmp/packages/ckeditor5-core'
				] )
			} );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.have.property( 'skipPackages' );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ].skipPackages ).to.deep.equal( [
						'@ckeditor/ckeditor5-engine'
					] );
					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );
					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.equal( skippedPackages );
				} );
		} );
	} );
} );
