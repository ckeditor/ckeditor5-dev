/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	let generateChangelogForSubRepositories, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			getPackagesToRelease: sandbox.stub(),
			displaySkippedPackages: sandbox.stub(),
			displayGeneratedChangelogs: sandbox.stub(),
			generateChangelogForSinglePackage: sandbox.stub(),
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

		mockery.registerMock( './generatechangelogforsinglepackage', stubs.generateChangelogForSinglePackage );
		mockery.registerMock( '../utils/getpackagejson', stubs.getPackageJson );
		mockery.registerMock( '../utils/displayskippedpackages', stubs.displaySkippedPackages );
		mockery.registerMock( '../utils/displaygeneratedchangelogs', stubs.displayGeneratedChangelogs );
		mockery.registerMock( '../utils/getpackagestorelease', stubs.getPackagesToRelease );
		mockery.registerMock( '../utils/getsubrepositoriespaths', stubs.getSubRepositoriesPaths );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

		// eslint-disable-next-line max-len
		generateChangelogForSubRepositories = proxyquire( '../../../lib/release-tools/tasks/generatechangelogforsubrepositories', {
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

	describe( 'generateChangelogForSubRepositories()', () => {
		it( 'executes "generateChangelogForSinglePackage" task on each package', () => {
			sandbox.stub( process, 'cwd' ).returns( '/tmp' );
			const chdirStub = sandbox.stub( process, 'chdir' );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-engine'
				] )
			} );

			stubs.generateChangelogForSinglePackage.onFirstCall().returns( Promise.resolve( '0.1.0' ) );
			stubs.generateChangelogForSinglePackage.onSecondCall().returns( Promise.resolve( '0.2.0' ) );

			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onSecondCall().returns( { name: '@ckeditor/ckeditor5-engine' } );

			const generatedChangelogsMap = new Map( [
				[ '@ckeditor/ckeditor5-core', '0.1.0' ],
				[ '@ckeditor/ckeditor5-engine', '0.2.0' ]
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages'
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.calledOnce ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						skipPackages: []
					} );

					expect( chdirStub.calledThrice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-engine' );
					expect( chdirStub.thirdCall.args[ 0 ] ).to.equal( '/tmp' );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );
					expect( stubs.displayGeneratedChangelogs.firstCall.args[ 0 ] ).to.deep.equal(
						generatedChangelogsMap
					);
				} );
		} );

		it( 'skips specified packages', () => {
			sandbox.stub( process, 'cwd' ).returns( '/tmp' );
			const chdirStub = sandbox.stub( process, 'chdir' );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set( [
					'/tmp/packages/ckeditor5-engine'
				] ),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core'
				] )
			} );

			stubs.generateChangelogForSinglePackage.onFirstCall().returns( Promise.resolve( '0.1.0' ) );
			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [ '@ckeditor/ckeditor5-engine' ]
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.calledOnce ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						skipPackages: options.skipPackages
					} );

					expect( chdirStub.calledTwice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/tmp' );

					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );
					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.deep.equal( new Set( [
						'@ckeditor/ckeditor5-engine'
					] ) );
				} );
		} );

		it( 'displays packages which will not have a new entry in changelog', () => {
			sandbox.stub( process, 'cwd' ).returns( '/tmp' );
			const chdirStub = sandbox.stub( process, 'chdir' );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				packages: new Set( [
					'/tmp/packages/ckeditor5-core'
				] )
			} );

			// User provided "skip" as a new version for changelog entries.
			stubs.generateChangelogForSinglePackage.onFirstCall().returns( Promise.resolve( null ) );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( chdirStub.calledTwice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/tmp' );

					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );
					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.deep.equal( new Set( [
						'@ckeditor/ckeditor5-core'
					] ) );
				} );
		} );
	} );
} );
