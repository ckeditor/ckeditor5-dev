/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
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
		sandbox = sinon.createSandbox();

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

		mockery.registerMock( './generatechangelogforsinglepackage', stubs.generateChangelogForSinglePackage );
		mockery.registerMock( '../utils/displayskippedpackages', stubs.displaySkippedPackages );
		mockery.registerMock( '../utils/displaygeneratedchangelogs', stubs.displayGeneratedChangelogs );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		generateChangelogForSubRepositories = proxyquire( '../../../lib/release-tools/tasks/generatechangelogforsubrepositories', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			},
			'../utils/getpackagejson': stubs.getPackageJson,
			'../utils/getpackagestorelease': stubs.getPackagesToRelease,
			'../utils/getsubrepositoriespaths': stubs.getSubRepositoriesPaths
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
				skipped: new Set( [
					'/tmp'
				] ),
				matched: new Set( [
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
				packages: 'packages',
				skipMainRepository: true
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.calledOnce ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						scope: null,
						skipPackages: [],
						skipMainRepository: true
					} );

					expect( chdirStub.calledThrice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-engine' );
					expect( chdirStub.thirdCall.args[ 0 ] ).to.equal( '/tmp' );

					expect( stubs.generateChangelogForSinglePackage.calledTwice ).to.equal( true );
					expect( stubs.generateChangelogForSinglePackage.firstCall.args[ 0 ] ).to.deep.equal( { newVersion: null } );
					expect( stubs.generateChangelogForSinglePackage.secondCall.args[ 0 ] ).to.deep.equal( { newVersion: null } );

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
					'/tmp/packages/ckeditor5-engine',
					'/tmp'
				] ),
				matched: new Set( [
					'/tmp/packages/ckeditor5-core'
				] )
			} );

			stubs.generateChangelogForSinglePackage.onFirstCall().returns( Promise.resolve( '0.1.0' ) );
			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				skipPackages: [ '@ckeditor/ckeditor5-engine' ],
				skipMainRepository: true,
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.calledOnce ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						scope: null,
						skipPackages: options.skipPackages,
						skipMainRepository: true
					} );

					expect( chdirStub.calledTwice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/tmp' );

					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );

					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.deep.equal( new Set( [
						'/tmp/packages/ckeditor5-engine',
						'/tmp'
					] ) );
				} );
		} );

		it( 'displays packages which will not have a new entry in changelog', () => {
			sandbox.stub( process, 'cwd' ).returns( '/tmp' );
			const chdirStub = sandbox.stub( process, 'chdir' );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				matched: new Set( [
					'/tmp/packages/ckeditor5-core'
				] )
			} );

			// User provided "skip" as a new version for changelog entries.
			stubs.generateChangelogForSinglePackage.onFirstCall().returns( Promise.resolve( null ) );
			stubs.getPackageJson.withArgs( '/tmp/packages/ckeditor5-core' ).returns( {
				dependencies: {}
			} );

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
						'/tmp/packages/ckeditor5-core'
					] ) );
				} );
		} );

		it( 'generates changelog for packages which dependencies have generated changelog', () => {
			sandbox.stub( process, 'cwd' ).returns( '/tmp' );
			const chdirStub = sandbox.stub( process, 'chdir' );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set(),
				matched: new Set( [
					'/tmp/packages/ckeditor5-autoformat',
					'/tmp/packages/ckeditor5-basic-styles',
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-fake-autoformat',
					'/tmp/packages/ckeditor5-paragraph',
				] )
			} );

			// For autoformat user provides "skip" as a new version.
			stubs.generateChangelogForSinglePackage.onCall( 0 ).returns( Promise.resolve( null ) );

			// For basic-styles user provides "skip" as a new version.
			stubs.generateChangelogForSinglePackage.onCall( 1 ).returns( Promise.resolve( null ) );

			// For core user provides a valid version,
			stubs.generateChangelogForSinglePackage.onCall( 2 ).returns( Promise.resolve( 'v1.0.0' ) );

			// For fake-autoformat user provides "skip" as a new version.
			stubs.generateChangelogForSinglePackage.onCall( 3 ).returns( Promise.resolve( null ) );

			// For paragraph user provides "skip" as a new version.
			stubs.generateChangelogForSinglePackage.onCall( 4 ).returns( Promise.resolve( null ) );

			stubs.getPackageJson.withArgs( '/tmp/packages/ckeditor5-autoformat' ).returns( {
				name: '@ckeditor/ckeditor5-autoformat',
				version: '1.0.0-alpha.1',
				dependencies: {
					'@ckeditor/ckeditor5-basic-styles': '*'
				}
			} );

			stubs.getPackageJson.withArgs( '/tmp/packages/ckeditor5-basic-styles' ).returns( {
				name: '@ckeditor/ckeditor5-basic-styles',
				version: '1.0.0',
				dependencies: {
					'@ckeditor/ckeditor5-core': '*'
				}
			} );

			stubs.getPackageJson.withArgs( '/tmp/packages/ckeditor5-core' ).returns( {
				name: '@ckeditor/ckeditor5-core',
				dependencies: {}
			} );

			stubs.getPackageJson.withArgs( '/tmp/packages/ckeditor5-fake-autoformat' ).returns( {
				name: '@ckeditor/ckeditor5-fake-autoformat',
				dependencies: {},
				devDependencies: {
					'@ckeditor/ckeditor5-autoformat': '*'
				}
			} );

			stubs.getPackageJson.withArgs( '/tmp/packages/ckeditor5-paragraph' ).returns( {
				name: '@ckeditor/ckeditor5-paragraph',
				version: '1.0.0',
				dependencies: {
					'@ckeditor/ckeditor5-core': '*'
				}
			} );

			// Changelogs for basic-styles and Paragraph will be generated too (cause the dependencies have changed).
			stubs.generateChangelogForSinglePackage.onCall( 5 ).returns( Promise.resolve( 'v1.0.1' ) );
			stubs.generateChangelogForSinglePackage.onCall( 6 ).returns( Promise.resolve( 'v1.0.1' ) );

			// Changelog for autoformat will be generated too because basic-styles will be changed.
			stubs.generateChangelogForSinglePackage.onCall( 7 ).returns( Promise.resolve( 'v1.0.0-alpha.2' ) );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( stubs.generateChangelogForSinglePackage.callCount ).to.equal( 8 );
					expect( chdirStub.callCount ).to.equal( 9 );

					// Calls 0-4 are done automatically by the tool.
					// Calls 5-7 depends on the dependencies. Generator should be called with "internal" version.
					expect( stubs.generateChangelogForSinglePackage.getCall( 5 ).args[ 0 ] ).to.deep.equal( { newVersion: 'internal' } );
					expect( stubs.generateChangelogForSinglePackage.getCall( 6 ).args[ 0 ] ).to.deep.equal( { newVersion: 'internal' } );
					expect( stubs.generateChangelogForSinglePackage.getCall( 7 ).args[ 0 ] ).to.deep.equal( { newVersion: 'internal' } );

					expect( chdirStub.getCall( 0 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-autoformat' );
					expect( chdirStub.getCall( 1 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-basic-styles' );
					expect( chdirStub.getCall( 2 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-core' );
					expect( chdirStub.getCall( 3 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-fake-autoformat' );
					expect( chdirStub.getCall( 4 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-paragraph' );
					expect( chdirStub.getCall( 5 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-basic-styles' );
					expect( chdirStub.getCall( 6 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-paragraph' );
					expect( chdirStub.getCall( 7 ).args[ 0 ] ).to.equal( '/tmp/packages/ckeditor5-autoformat' );
					expect( chdirStub.getCall( 8 ).args[ 0 ] ).to.equal( '/tmp' );

					// @ckeditor/ckeditor5-fake-autoformat was skipped because it was set as a dev dependency.

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );

					const generatedChangelogsMap = stubs.displayGeneratedChangelogs.firstCall.args[ 0 ];

					expect( generatedChangelogsMap.size ).to.equal( 4 );
					expect( generatedChangelogsMap.get( '@ckeditor/ckeditor5-core' ) ).to.equal( 'v1.0.0' );
					expect( generatedChangelogsMap.get( '@ckeditor/ckeditor5-basic-styles' ) ).to.equal( 'v1.0.1' );
					expect( generatedChangelogsMap.get( '@ckeditor/ckeditor5-paragraph' ) ).to.equal( 'v1.0.1' );
					expect( generatedChangelogsMap.get( '@ckeditor/ckeditor5-autoformat' ) ).to.equal( 'v1.0.0-alpha.2' );

					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );

					const skippedPackagesPaths = stubs.displaySkippedPackages.firstCall.args[ 0 ];

					expect( skippedPackagesPaths.size ).to.equal( 1 );
					expect( skippedPackagesPaths.has( '/tmp/packages/ckeditor5-fake-autoformat' ) ).to.equal( true );
				} );
		} );

		it( 'allows specifying version for all packages', () => {
			sandbox.stub( process, 'cwd' ).returns( '/tmp' );
			sandbox.stub( process, 'chdir' );

			stubs.getSubRepositoriesPaths.returns( {
				skipped: new Set( [
					'/tmp'
				] ),
				matched: new Set( [
					'/tmp/packages/ckeditor5-core',
					'/tmp/packages/ckeditor5-engine'
				] )
			} );

			stubs.generateChangelogForSinglePackage.onFirstCall().returns( Promise.resolve( '1.0.0' ) );
			stubs.generateChangelogForSinglePackage.onSecondCall().returns( Promise.resolve( '1.0.0' ) );

			stubs.getPackageJson.onFirstCall().returns( { name: '@ckeditor/ckeditor5-core' } );
			stubs.getPackageJson.onSecondCall().returns( { name: '@ckeditor/ckeditor5-engine' } );

			const generatedChangelogsMap = new Map( [
				[ '@ckeditor/ckeditor5-core', '1.0.0' ],
				[ '@ckeditor/ckeditor5-engine', '1.0.0' ]
			] );

			const options = {
				cwd: '/tmp',
				packages: 'packages',
				newVersion: '1.0.0',
				skipMainRepository: true
			};

			return generateChangelogForSubRepositories( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.calledOnce ).to.equal( true );
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						scope: null,
						skipPackages: [],
						skipMainRepository: true
					} );

					expect( stubs.generateChangelogForSinglePackage.calledTwice ).to.equal( true );
					expect( stubs.generateChangelogForSinglePackage.firstCall.args[ 0 ] ).to.deep.equal( { newVersion: '1.0.0' } );
					expect( stubs.generateChangelogForSinglePackage.secondCall.args[ 0 ] ).to.deep.equal( { newVersion: '1.0.0' } );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );
					expect( stubs.displayGeneratedChangelogs.firstCall.args[ 0 ] ).to.deep.equal(
						generatedChangelogsMap
					);
				} );
		} );
	} );
} );
