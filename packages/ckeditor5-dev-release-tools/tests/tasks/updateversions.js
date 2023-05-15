/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/release', () => {
	let updateVersions, sandbox, stubs;

	describe( 'updateVersions()', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				outputJson: sandbox.stub(),
				getPackageJson: sandbox.stub().returns( { version: '1.0.0' } ),
				globSync: sandbox.stub().returns( [ '/ckeditor5-dev' ] ),
				shExec: sandbox.stub().throws( new Error( 'is not in this registry' ) )
			};

			updateVersions = proxyquire( '../../lib/tasks/updateversions.js', {
				'fs-extra': {
					writeJson: stubs.outputJson
				},
				'../utils/getpackagejson': stubs.getPackageJson,
				'glob': { globSync: stubs.globSync },
				'@ckeditor/ckeditor5-dev-utils': {
					tools: {
						shExec: stubs.shExec
					}
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should update the version field in all found packages including the root package', async () => {
			stubs.globSync.returns( [
				'/ckeditor5-dev/packages/package1/package.json',
				'/ckeditor5-dev/packages/package2/package.json',
				'/ckeditor5-dev/packages/package3/package.json',
				'/ckeditor5-dev/package.json'
			] );

			await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( stubs.globSync.callCount ).to.equal( 1 );
			expect( stubs.globSync.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json', 'packages/*/package.json' ] );

			expect( stubs.outputJson.callCount ).to.equal( 4 );
			expect( stubs.outputJson.getCall( 0 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package1/package.json' );
			expect( stubs.outputJson.getCall( 0 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 3 ).args[ 0 ] ).to.equal( '/ckeditor5-dev/package.json' );
			expect( stubs.outputJson.getCall( 3 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should update the version field in the root package when packagesDirectory is not provided', async () => {
			stubs.globSync.returns( [ '/ckeditor5-dev' ] );

			await updateVersions( { version: '1.0.1' } );

			expect( stubs.globSync.callCount ).to.equal( 1 );
			expect( stubs.globSync.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json' ] );

			expect( stubs.outputJson.callCount ).to.equal( 1 );
			expect( stubs.outputJson.firstCall.args[ 0 ] ).to.contain( '/ckeditor5-dev' );
			expect( stubs.outputJson.firstCall.args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should throw an error when the version is already in use', async () => {
			stubs.getPackageJson.returns( { version: '1.0.0', name: 'stub-package' } );
			stubs.shExec.returns( '' );

			try {
				await updateVersions( { version: '1.0.1' } );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'Provided version 1.0.1 is already used in npm by stub-package.' );
			}
		} );

		it( 'should not throw an error when version is not in use', async () => {
			stubs.shExec.throws( new Error( 'is not in this registry' ) );
			stubs.getPackageJson.returns( { version: '1.0.0', name: 'stub-package' } );

			try {
				await updateVersions( { version: '1.0.1' } );
			} catch ( err ) {
				throw new Error( 'Expected not to throw.' );
			}
		} );

		it( 'should throw an error when checking the version availability check throws error', async () => {
			stubs.shExec.throws( new Error( 'custom error' ) );
			stubs.getPackageJson.returns( { version: '1.0.0', name: 'stub-package' } );

			try {
				await updateVersions( { version: '1.0.1' } );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'custom error' );
			}
		} );

		it( 'should not provide the root package name when checking version availability if packagesDirectory is provided', async () => {
			stubs.globSync.returns( [
				'/ckeditor5-dev/packages/package1/package.json',
				'/ckeditor5-dev/packages/package2/package.json',
				'/ckeditor5-dev/package.json'
			] );
			stubs.getPackageJson.withArgs( '/ckeditor5-dev/packages/package1' ).returns( { name: 'package1' } );
			stubs.getPackageJson.withArgs( '/ckeditor5-dev/packages/package2' ).returns( { name: 'package2' } );
			stubs.getPackageJson.withArgs( '/ckeditor5-dev' ).returns( { name: 'root-package' } );

			await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( stubs.shExec.callCount ).to.equal( 1 );
			expect( stubs.shExec.firstCall.args[ 0 ] ).to.not.equal( 'npm show root-package@1.0.1 version' );
		} );

		it( 'should provide the root package name when checking version availability if packagesDirectory is not provided', async () => {
			stubs.globSync.returns( [ '/ckeditor5-dev/package.json' ] );
			stubs.getPackageJson.withArgs( '/ckeditor5-dev' ).returns( { name: 'root-package' } );

			await updateVersions( { version: '1.0.1' } );

			expect( stubs.shExec.callCount ).to.equal( 1 );
			expect( stubs.shExec.firstCall.args[ 0 ] ).to.equal( 'npm show root-package@1.0.1 version' );
		} );

		it( 'should accept `0.0.0-nightly*` version for nightly releases', async () => {
			stubs.getPackageJson.returns( { version: '1.0.0', name: 'stub-package' } );

			try {
				await updateVersions( { version: '0.0.0-nightly-20230510.0' } );
			} catch ( err ) {
				throw new Error( 'Expected not to throw.' );
			}
		} );

		it( 'should throw when new version is not greater than the current one', async () => {
			stubs.getPackageJson.returns( { version: '1.0.1' } );

			try {
				await updateVersions( { version: '1.0.0' } );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'Provided version 1.0.0 must be greater than 1.0.1 or match pattern 0.0.0-nightly.' );
			}
		} );

		it( 'should throw an error when new version is not a valid semver version', async () => {
			try {
				await updateVersions( { version: 'x.y.z' } );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'Invalid Version: x.y.z' );
			}
		} );

		it( 'should be able to provide custom cwd', async () => {
			await updateVersions( { version: '1.0.1', cwd: 'Users/username/ckeditor5-dev/custom-dir' } );

			expect( stubs.globSync.firstCall.args[ 1 ] ).to.deep.equal( {
				cwd: 'Users/username/ckeditor5-dev/custom-dir',
				absolute: true,
				nodir: true
			} );
		} );
	} );
} );
