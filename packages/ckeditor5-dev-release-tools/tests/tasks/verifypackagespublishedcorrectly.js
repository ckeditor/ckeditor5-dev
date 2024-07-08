/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'verifyPackagesPublishedCorrectly()', () => {
		let verifyPackagesPublishedCorrectly, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					remove: sandbox.stub().resolves(),
					readJson: sandbox.stub().resolves()
				},
				devUtils: {
					checkVersionAvailability: sandbox.stub().resolves()
				},
				glob: {
					glob: sandbox.stub().resolves( [] )
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( '../utils/checkversionavailability', stubs.devUtils );
			mockery.registerMock( 'glob', stubs.glob );

			verifyPackagesPublishedCorrectly = require( '../../lib/tasks/verifypackagespublishedcorrectly' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should not verify packages if there are no packages in the release directory', async () => {
			stubs.glob.glob.resolves( [] );

			const packagesDirectory = '/workspace/ckeditor5/release/npm';
			const version = 'latest';
			const onSuccess = sandbox.stub();

			await verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } );

			expect( onSuccess.firstCall.args[ 0 ] ).to.equal( '✅ No packages found to check for upload error 409.' );
			expect( stubs.devUtils.checkVersionAvailability.callCount ).to.equal( 0 );
		} );

		it( 'should verify packages and remove them from the release directory on "npm show" command success', async () => {
			stubs.glob.glob.resolves( [ 'package1', 'package2' ] );
			stubs.fs.readJson
				.onCall( 0 ).resolves( { name: '@namespace/package1' } )
				.onCall( 1 ).resolves( { name: '@namespace/package2' } );

			const packagesDirectory = '/workspace/ckeditor5/release/npm';
			const version = 'latest';
			const onSuccess = sandbox.stub();

			await verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } );

			expect( stubs.devUtils.checkVersionAvailability.firstCall.args[ 0 ] ).to.equal( 'latest' );
			expect( stubs.devUtils.checkVersionAvailability.firstCall.args[ 1 ] ).to.equal( '@namespace/package1' );
			expect( stubs.fs.remove.firstCall.args[ 0 ] ).to.equal( 'package1' );

			expect( stubs.devUtils.checkVersionAvailability.secondCall.args[ 0 ] ).to.equal( 'latest' );
			expect( stubs.devUtils.checkVersionAvailability.secondCall.args[ 1 ] ).to.equal( '@namespace/package2' );
			expect( stubs.fs.remove.secondCall.args[ 0 ] ).to.equal( 'package2' );

			expect( onSuccess.firstCall.args[ 0 ] ).to.equal( '✅ All packages that returned 409 were uploaded correctly.' );
		} );

		it( 'should not remove package from release directory when package is not available on npm', async () => {
			stubs.glob.glob.resolves( [ 'package1', 'package2' ] );
			stubs.fs.readJson
				.onCall( 0 ).resolves( { name: '@namespace/package1' } )
				.onCall( 1 ).resolves( { name: '@namespace/package2' } );
			stubs.devUtils.checkVersionAvailability
				.onCall( 0 ).resolves( true )
				.onCall( 1 ).resolves( false );

			const packagesDirectory = '/workspace/ckeditor5/release/npm';
			const version = 'latest';
			const onSuccess = sandbox.stub();

			await verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } )
				.then(
					() => {
						throw new Error( 'this should not be thrown!' );
					},
					e => {
						expect( e.message ).to.equal(
							'Packages that were uploaded incorrectly, and need manual verification:\n@namespace/package1'
						);
					}
				);

			expect( stubs.fs.remove.callCount ).to.equal( 1 );
			expect( stubs.fs.remove.firstCall.args[ 0 ] ).to.equal( 'package2' );
		} );

		it( 'should not remove package from release directory when checking version on npm throws error', async () => {
			stubs.glob.glob.resolves( [ 'package1', 'package2' ] );
			stubs.fs.readJson
				.onCall( 0 ).resolves( { name: '@namespace/package1' } )
				.onCall( 1 ).resolves( { name: '@namespace/package2' } );
			stubs.devUtils.checkVersionAvailability
				.onCall( 0 ).rejects()
				.onCall( 1 ).resolves();

			const packagesDirectory = '/workspace/ckeditor5/release/npm';
			const version = 'latest';
			const onSuccess = sandbox.stub();

			await verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } )
				.then(
					() => {
						throw new Error( 'this should not be thrown!' );
					},
					e => {
						expect( e.message ).to.equal(
							'Packages that were uploaded incorrectly, and need manual verification:\n@namespace/package1'
						);
					}
				);

			expect( stubs.fs.remove.callCount ).to.equal( 1 );
			expect( stubs.fs.remove.firstCall.args[ 0 ] ).to.equal( 'package2' );
		} );
	} );
} );
