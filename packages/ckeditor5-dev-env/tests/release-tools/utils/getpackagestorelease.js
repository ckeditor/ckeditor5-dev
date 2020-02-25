/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'getPackagesToRelease()', () => {
		let getPackagesToRelease, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

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
				}
			};

			getPackagesToRelease = proxyquire( '../../../lib/release-tools/utils/getpackagestorelease', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
						return stubs.logger;
					}
				},
				'./getpackagejson': stubs.getPackageJson,
				'./versions': stubs.versions
			} );
		} );

		afterEach( () => {
			sandbox.restore();
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
				.then( packages => {
					expect( packages.size ).to.equal( 2 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '0.6.0' );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '1.0.1' );
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
				.then( packages => {
					expect( packages.size ).to.equal( 1 );

					expect( packages.get( '@ckeditor/ckeditor5-utils' ) ).to.equal( undefined );
				} );
		} );
	} );
} );
