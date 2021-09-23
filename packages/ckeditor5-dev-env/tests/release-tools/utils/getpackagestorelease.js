/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
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
				'[@ckeditor/ckeditor5-core](npm link): v0.5.0 => v1.0.0',
				'[@ckeditor/ckeditor5-engine](npm link): v1.0.0 => v1.0.1'
			].join( '\n' );

			return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0' } )
				.then( packages => {
					expect( packages.size ).to.equal( 2 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

					const corePackage = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackage.version ).to.equal( '1.0.0' );

					const enginePackage = packages.get( '@ckeditor/ckeditor5-engine' );
					expect( enginePackage.version ).to.equal( '1.0.1' );
				} );
		} );

		it( 'returns the version specified in options for the "main package"', () => {
			const packagesToCheck = new Set( [
				'/cwd'
			] );

			stubs.getPackageJson.onFirstCall().returns( {
				name: 'ckeditor5',
				version: '1.0.0'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			return getPackagesToRelease( packagesToCheck, { changes: 'Foo bar.', version: '2.0.0' } )
				.then( packages => {
					expect( packages.size ).to.equal( 1 );

					expect( stubs.chdir.calledTwice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/cwd' );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/cwd' );

					const mainPackage = packages.get( 'ckeditor5' );
					expect( mainPackage.version ).to.equal( '2.0.0' );
				} );
		} );

		it( 'returns proper version for a new package', () => {
			const packagesToCheck = new Set( [
				'/packages/ckeditor5-new-package'
			] );

			// @ckeditor/ckeditor5-core
			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-new-package',
				version: '0.0.1'
			} );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			const changes = [
				'[@ckeditor/ckeditor5-new-package](npm link): v1.0.0'
			].join( '\n' );

			return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0' } )
				.then( packages => {
					expect( packages.size ).to.equal( 1 );

					expect( stubs.chdir.calledTwice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-new-package$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/cwd' );

					const newPackagePackage = packages.get( '@ckeditor/ckeditor5-new-package' );
					expect( newPackagePackage.version ).to.equal( '1.0.0' );
				} );
		} );

		it( 'ignores a package if a version is not specified in the changes description', () => {
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
				'[@ckeditor/ckeditor5-core](npm link): v0.5.0 => v1.0.0'
			].join( '\n' );

			return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0' } )
				.then( packages => {
					expect( packages.size ).to.equal( 1 );

					expect( stubs.chdir.calledThrice ).to.equal( true );
					expect( stubs.chdir.firstCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-core$/ );
					expect( stubs.chdir.secondCall.args[ 0 ] ).to.match( /^\/packages\/ckeditor5-engine$/ );
					expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

					const corePackage = packages.get( '@ckeditor/ckeditor5-core' );
					expect( corePackage.version ).to.equal( '1.0.0' );
				} );
		} );

		// See: https://github.com/ckeditor/ckeditor5/issues/10583.
		describe( 'pre-release versions', () => {
			it( 'returns proper versions for existing packages (alpha release)', () => {
				const packagesToCheck = new Set( [
					'/cwd',
					'/packages/ckeditor5-core'
				] );

				// ckeditor5
				stubs.getPackageJson.onFirstCall().returns( {
					name: 'ckeditor5',
					version: '1.0.0'
				} );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onSecondCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '1.0.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[ckeditor5](npm link): v1.0.0 => v2.0.0-alpha.0',
					'[@ckeditor/ckeditor5-core](npm link): v1.0.0 => v2.0.0-alpha.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0-alpha.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 2 );

						expect( stubs.chdir.calledThrice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/cwd' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

						const corePackage = packages.get( '@ckeditor/ckeditor5-core' );
						expect( corePackage.version ).to.equal( '2.0.0-alpha.0' );

						const ckeditor5Package = packages.get( 'ckeditor5' );
						expect( ckeditor5Package.version ).to.equal( '2.0.0-alpha.0' );
					} );
			} );

			it( 'returns proper versions for existing packages (release candidate)', () => {
				const packagesToCheck = new Set( [
					'/cwd',
					'/packages/ckeditor5-core'
				] );

				// ckeditor5
				stubs.getPackageJson.onFirstCall().returns( {
					name: 'ckeditor5',
					version: '2.0.0-alpha.0'
				} );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onSecondCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '2.0.0-alpha.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[ckeditor5](npm link): v2.0.0-alpha.0 => v2.0.0-rc.0',
					'[@ckeditor/ckeditor5-core](npm link): v2.0.0-alpha.0 => v2.0.0-rc.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0-rc.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 2 );

						expect( stubs.chdir.calledThrice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/cwd' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

						const corePackage = packages.get( '@ckeditor/ckeditor5-core' );
						expect( corePackage.version ).to.equal( '2.0.0-rc.0' );

						const ckeditor5Package = packages.get( 'ckeditor5' );
						expect( ckeditor5Package.version ).to.equal( '2.0.0-rc.0' );
					} );
			} );

			it( 'returns proper versions for existing packages (from alpha to release candidate)', () => {
				const packagesToCheck = new Set( [
					'/cwd',
					'/packages/ckeditor5-core'
				] );

				// ckeditor5
				stubs.getPackageJson.onFirstCall().returns( {
					name: 'ckeditor5',
					version: '1.0.0'
				} );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onSecondCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '1.0.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[ckeditor5](npm link): v1.0.0 => v2.0.0-rc.0',
					'[@ckeditor/ckeditor5-core](npm link): v1.0.0 => v2.0.0-rc.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0-rc.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 2 );

						expect( stubs.chdir.calledThrice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/cwd' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

						const corePackage = packages.get( '@ckeditor/ckeditor5-core' );
						expect( corePackage.version ).to.equal( '2.0.0-rc.0' );

						const ckeditor5Package = packages.get( 'ckeditor5' );
						expect( ckeditor5Package.version ).to.equal( '2.0.0-rc.0' );
					} );
			} );

			it( 'returns proper versions for new packages (alpha release)', () => {
				const packagesToCheck = new Set( [
					'/cwd',
					'/packages/ckeditor5-core'
				] );

				// ckeditor5
				stubs.getPackageJson.onFirstCall().returns( {
					name: 'ckeditor5',
					version: '1.0.0'
				} );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onSecondCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '1.0.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[ckeditor5](npm link): v1.0.0-alpha.0',
					'[@ckeditor/ckeditor5-core](npm link): v1.0.0-alpha.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '1.0.0-alpha.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 2 );

						expect( stubs.chdir.calledThrice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/cwd' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.thirdCall.args[ 0 ] ).to.equal( '/cwd' );

						const corePackage = packages.get( '@ckeditor/ckeditor5-core' );
						expect( corePackage.version ).to.equal( '1.0.0-alpha.0' );

						const ckeditor5Package = packages.get( 'ckeditor5' );
						expect( ckeditor5Package.version ).to.equal( '1.0.0-alpha.0' );
					} );
			} );

			it( 'does not return a package if a version misses the "dash" symbol (an existing package)', () => {
				const packagesToCheck = new Set( [
					'/packages/ckeditor5-core'
				] );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onFirstCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '1.0.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[@ckeditor/ckeditor5-core](npm link): v1.0.0 => v2.0.0.alpha.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0-alpha.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 0 );

						expect( stubs.chdir.calledTwice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/cwd' );
					} );
			} );

			it( 'does not return a package if a version misses the "dash" symbol (an existing package, from alpha to rc)', () => {
				const packagesToCheck = new Set( [
					'/packages/ckeditor5-core'
				] );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onFirstCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '2.0.0-alpha.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[@ckeditor/ckeditor5-core](npm link): v2.0.0-alpha.0 => v2.0.0.rc.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '2.0.0-rc.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 0 );

						expect( stubs.chdir.calledTwice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/cwd' );
					} );
			} );

			it( 'does not return a package if a version misses the "dash" symbol (a new package)', () => {
				const packagesToCheck = new Set( [
					'/packages/ckeditor5-core'
				] );

				// @ckeditor/ckeditor5-core
				stubs.getPackageJson.onFirstCall().returns( {
					name: '@ckeditor/ckeditor5-core',
					version: '1.0.0'
				} );

				sandbox.stub( process, 'cwd' ).returns( '/cwd' );

				const changes = [
					'[@ckeditor/ckeditor5-core](npm link): v1.0.0.alpha.0'
				].join( '\n' );

				return getPackagesToRelease( packagesToCheck, { changes, version: '1.0.0-alpha.0' } )
					.then( packages => {
						expect( packages.size ).to.equal( 0 );

						expect( stubs.chdir.calledTwice ).to.equal( true );
						expect( stubs.chdir.firstCall.args[ 0 ] ).to.equal( '/packages/ckeditor5-core' );
						expect( stubs.chdir.secondCall.args[ 0 ] ).to.equal( '/cwd' );
					} );
			} );
		} );
	} );
} );
