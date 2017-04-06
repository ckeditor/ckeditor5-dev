/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'getPackagesToRelease()', () => {
		let getPackagesToRelease, sandbox, execOptions, stubs;
		let packagesToCheck = [];
		let skipedPackages = [];

		const options = {
			cwd: __dirname,
			packages: 'packages/'
		};

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
				displaySkippedPackages: sandbox.stub()
			};

			mockery.registerMock( './executeondependencies', ( options, functionToExecute ) => {
				execOptions = options;

				const packagesPath = path.join( options.cwd, options.packages );

				let promise = Promise.resolve();

				for ( const item of packagesToCheck ) {
					promise = promise.then( () => {
						return functionToExecute( item, path.join( packagesPath, item.replace( '@', '' ) ) );
					} );
				}

				return promise.then( () => Promise.resolve( skipedPackages ) );
			} );
			mockery.registerMock( './versions', stubs.versions );
			mockery.registerMock( './displayskippedpackages', stubs.displaySkippedPackages );

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
			packagesToCheck = [
				'@ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-engine'
			];

			// @ckeditor/ckeditor5-core
			stubs.versions.getLastFromChangelog.onFirstCall().returns( '0.6.0' );
			stubs.versions.getLastTagFromGit.onFirstCall().returns( '0.5.0' );
			stubs.getPackageJson.onFirstCall().returns( {
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.versions.getLastFromChangelog.onSecondCall().returns( '1.0.1' );
			stubs.versions.getLastTagFromGit.onSecondCall().returns( '1.0.0' );
			stubs.getPackageJson.onSecondCall().returns( {
				version: '1.0.0'
			} );

			return getPackagesToRelease( options )
				.then( ( packages ) => {
					expect( packages.size ).to.equal( 2 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( __dirname );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '0.6.0' );
					expect( corePackageDetails.hasChangelog ).to.equal( true );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '1.0.1' );
					expect( enginePackageDetails.hasChangelog ).to.equal( true );

					expect( execOptions ).to.deep.equal( {
						cwd: __dirname,
						packages: 'packages/',
						skipPackages: []
					} );
				} );
		} );

		it( 'returns packages with changes and also dependent packages', () => {
			packagesToCheck = [
				'@ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-engine',
				'@ckeditor/ckeditor5-basic-styles',
			];

			// @ckeditor/ckeditor5-core
			stubs.versions.getLastFromChangelog.onFirstCall().returns( '0.6.0' );
			stubs.versions.getLastTagFromGit.onFirstCall().returns( '0.5.0' );
			stubs.getPackageJson.onFirstCall().returns( {
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.versions.getLastFromChangelog.onSecondCall().returns( '1.0.0' );
			stubs.versions.getLastTagFromGit.onSecondCall().returns( '1.0.0' );
			stubs.getPackageJson.onSecondCall().returns( {
				version: '1.0.0',
				dependencies: {
					'@ckeditor/ckeditor5-core': '^0.5.0'
				}
			} );

			// @ckeditor/ckeditor5-basic-styles
			stubs.versions.getLastFromChangelog.onThirdCall().returns( '0.1.0' );
			stubs.versions.getLastTagFromGit.onThirdCall().returns( '0.1.0' );
			stubs.getPackageJson.onThirdCall().returns( {
				version: '0.1.0',
				dependencies: {
					'@ckeditor/ckeditor5-engine': '^1.0.0'
				}
			} );

			return getPackagesToRelease( options )
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
			packagesToCheck = [
				'@ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-utils'
			];

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

			return getPackagesToRelease( options )
				.then( ( packages ) => {
					expect( packages.size ).to.equal( 1 );

					expect( packages.get( '@ckeditor/ckeditor5-utils' ) ).to.equal( undefined );
				} );
		} );

		it( 'informs about skipped packages', () => {
			packagesToCheck = [];
			options.skipPackages = [
				'@ckeditor/ckeditor5-foo',
				'@ckeditor/ckeditor5-bar'
			];

			skipedPackages = options.skipPackages.slice();

			return getPackagesToRelease( options )
				.then( () => {
					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );
					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.deep.equal( [
						'@ckeditor/ckeditor5-foo',
						'@ckeditor/ckeditor5-bar'
					] );
				} );
		} );
	} );
} );
