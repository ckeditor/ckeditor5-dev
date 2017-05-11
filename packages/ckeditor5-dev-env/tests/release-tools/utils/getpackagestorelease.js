/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'getPackagesToRelease()', () => {
		let getPackagesToRelease, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				chdir: sandbox.stub( process, 'chdir' ),
				getPackageJson: sandbox.stub(),
				versions: {
					getLastFromChangelog: sandbox.stub(),
					getLastTagFromGit: sandbox.stub(),
					getCurrent: sandbox.stub()
				},
				logger: {
					info: sandbox.stub(),
					warning: sandbox.stub(),
					error: sandbox.stub()
				},
			};

			mockery.registerMock( './executeonpackages', ( pathsToPackages, functionToExecute ) => {
				let promise = Promise.resolve();

				for ( const repositoryPath of pathsToPackages ) {
					promise = promise.then( () => functionToExecute( repositoryPath ) );
				}

				return promise;
			} );

			mockery.registerMock( './versions', stubs.versions );

			getPackagesToRelease = proxyquire( '../../../lib/release-tools/utils/getpackagestorelease', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
						return stubs.logger;
					}
				},
				'./getpackagejson': stubs.getPackageJson
			} );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'returns all packages with changes', () => {
			const packagesToCheck = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-engine'
			] );

			// @ckeditor/ckeditor5-core
			stubs.versions.getLastFromChangelog.onFirstCall().returns( '0.6.0' );
			stubs.versions.getLastTagFromGit.onFirstCall().returns( '0.5.0' );
			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-core',
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.versions.getLastFromChangelog.onSecondCall().returns( '1.0.1' );
			stubs.versions.getLastTagFromGit.onSecondCall().returns( '1.0.0' );
			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-engine',
				version: '1.0.0'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			return getPackagesToRelease( packagesToCheck )
				.then( ( packages ) => {
					expect( packages.size ).to.equal( 2 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '0.6.0' );
					expect( corePackageDetails.hasChangelog ).to.equal( true );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '1.0.1' );
					expect( enginePackageDetails.hasChangelog ).to.equal( true );
				} );
		} );

		it( 'returns packages with changes and also dependent packages', () => {
			const packagesToCheck = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-engine',
				'/packages/ckeditor5-basic-styles'
			] );

			// @ckeditor/ckeditor5-core
			stubs.versions.getLastFromChangelog.onFirstCall().returns( '0.6.0' );
			stubs.versions.getLastTagFromGit.onFirstCall().returns( '0.5.0' );
			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-core',
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.versions.getLastFromChangelog.onSecondCall().returns( '1.0.0' );
			stubs.versions.getLastTagFromGit.onSecondCall().returns( '1.0.0' );
			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-engine',
				version: '1.0.0',
				dependencies: {
					'@ckeditor/ckeditor5-core': '^0.5.0'
				}
			} );

			// @ckeditor/ckeditor5-basic-styles
			// This package does not have any changes but will be released because
			// its dependency (@ckeditor/ckeditor5-engine) will be release.
			stubs.versions.getLastFromChangelog.onThirdCall().returns( '0.1.0' );
			stubs.versions.getLastTagFromGit.onThirdCall().returns( '0.1.0' );
			stubs.getPackageJson.onThirdCall().returns( {
				name: '@ckeditor/ckeditor5-basic-styles',
				version: '0.1.0',
				dependencies: {
					'@ckeditor/ckeditor5-engine': '^1.0.0'
				}
			} );

			return getPackagesToRelease( packagesToCheck )
				.then( ( packages ) => {
					expect( packages.size ).to.equal( 3 );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '0.6.0' );
					expect( corePackageDetails.hasChangelog ).to.equal( true );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '1.0.1' );
					expect( enginePackageDetails.hasChangelog ).to.equal( false );

					const basicStylesPackageDetails = packages.get( '@ckeditor/ckeditor5-basic-styles' );
					expect( basicStylesPackageDetails.version ).to.equal( '0.1.1' );
					expect( basicStylesPackageDetails.hasChangelog ).to.equal( false );
				} );
		} );

		it( 'ignores package if its dependencies have not changed', () => {
			const packagesToCheck = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-utils'
			] );

			// @ckeditor/ckeditor5-core
			stubs.versions.getLastFromChangelog.onFirstCall().returns( '0.6.0' );
			stubs.versions.getLastTagFromGit.onFirstCall().returns( '0.5.0' );
			stubs.getPackageJson.onFirstCall().returns( {
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-utils
			stubs.versions.getLastFromChangelog.onSecondCall().returns( '1.0.0' );
			stubs.versions.getLastTagFromGit.onSecondCall().returns( '1.0.0' );
			stubs.getPackageJson.onSecondCall().returns( {} );

			return getPackagesToRelease( packagesToCheck )
				.then( ( packages ) => {
					expect( packages.size ).to.equal( 1 );

					expect( packages.get( '@ckeditor/ckeditor5-utils' ) ).to.equal( undefined );
				} );
		} );

		it( 'does not throw when packages are released for the first time', () => {
			const packagesToCheck = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-engine'
			] );

			// @ckeditor/ckeditor5-core
			stubs.versions.getLastFromChangelog.onFirstCall().returns( '0.1.0' );
			stubs.versions.getLastTagFromGit.onFirstCall().returns( null );
			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-core',
				version: '0.0.1'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.versions.getLastFromChangelog.onSecondCall().returns( '0.1.0' );
			stubs.versions.getLastTagFromGit.onSecondCall().returns( null );
			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-engine',
				version: '0.0.1'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			return getPackagesToRelease( packagesToCheck )
				.then( ( packages ) => {
					expect( packages.size ).to.equal( 2 );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '0.1.0' );
					expect( corePackageDetails.hasChangelog ).to.equal( true );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '0.1.0' );
					expect( enginePackageDetails.hasChangelog ).to.equal( true );
				} );
		} );
	} );
} );
