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
			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-core',
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-engine',
				version: '1.0.0'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			const changes = [
				'[@ckeditor/ckeditor5-core](npm link): v0.5.0 => [v1.0.0](GitHub link)',
				'[@ckeditor/ckeditor5-engine](npm link): v1.0.0 => [v1.0.1](GitHub link)'
			].join( '\n' );

			return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0' } )
				.then( packages => {
					expect( packages.size ).to.equal( 2 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '1.0.0' );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '1.0.1' );
				} );
		} );

		it( 'uses passed version if changes miss some package', () => {
			const packagesToCheck = new Set( [
				'/packages/ckeditor5-core',
				'/packages/ckeditor5-engine'
			] );

			// @ckeditor/ckeditor5-core
			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-core',
				version: '0.5.0'
			} );

			// @ckeditor/ckeditor5-engine
			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-engine',
				version: '1.0.0'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			const changes = [
				'[@ckeditor/ckeditor5-core](npm link): v0.5.0 => [v1.0.0](GitHub link)'
			].join( '\n' );

			return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0' } )
				.then( packages => {
					expect( packages.size ).to.equal( 2 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

					const corePackageDetails = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackageDetails.version ).to.equal( '1.0.0' );

					const enginePackageDetails = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackageDetails.version ).to.equal( '2.0.0' );
				} );
		} );
	} );
} );
