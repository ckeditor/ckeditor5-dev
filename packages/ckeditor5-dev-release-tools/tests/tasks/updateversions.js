/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const upath = require( 'upath' );
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
				readJson: sandbox.stub().resolves( { version: '1.0.0' } ),
				glob: sandbox.stub().resolves( [ '/ckeditor5-dev' ] ),
				checkVersionAvailability: sandbox.stub().resolves( true )
			};

			updateVersions = proxyquire( '../../lib/tasks/updateversions.js', {
				'fs-extra': {
					writeJson: stubs.outputJson,
					readJson: stubs.readJson
				},
				'glob': { glob: stubs.glob },
				'../utils/checkversionavailability': stubs.checkVersionAvailability
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should update the version field in all found packages including the root package', async () => {
			stubs.glob.resolves( [
				'/ckeditor5-dev/packages/package1/package.json',
				'/ckeditor5-dev/packages/package2/package.json',
				'/ckeditor5-dev/packages/package3/package.json',
				'/ckeditor5-dev/package.json'
			] );

			await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( stubs.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json', 'packages/*/package.json' ] );

			expect( stubs.outputJson.callCount ).to.equal( 4 );
			expect( stubs.outputJson.getCall( 0 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package1/package.json' );
			expect( stubs.outputJson.getCall( 0 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 1 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package2/package.json' );
			expect( stubs.outputJson.getCall( 1 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 2 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package3/package.json' );
			expect( stubs.outputJson.getCall( 2 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 3 ).args[ 0 ] ).to.equal( '/ckeditor5-dev/package.json' );
			expect( stubs.outputJson.getCall( 3 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should allow filtering out packages that do not pass the `packagesDirectoryFilter` callback', async () => {
			stubs.glob.resolves( [
				'/ckeditor5-dev/packages/package1/package.json',
				'/ckeditor5-dev/packages/package-bar/package.json',
				'/ckeditor5-dev/packages/package-foo/package.json',
				'/ckeditor5-dev/packages/package-number/package.json',
				'/ckeditor5-dev/package.json'
			] );

			const directoriesToSkip = [
				'package-number'
			];

			await updateVersions( {
				version: '1.0.1',
				packagesDirectory: 'packages',
				packagesDirectoryFilter: packageJsonPath => {
					return !directoriesToSkip.some( item => {
						return upath.dirname( packageJsonPath ).endsWith( item );
					} );
				}
			} );

			expect( stubs.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json', 'packages/*/package.json' ] );

			expect( stubs.outputJson.callCount ).to.equal( 4 );
			expect( stubs.outputJson.getCall( 0 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package1/package.json' );
			expect( stubs.outputJson.getCall( 0 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 1 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package-bar/package.json' );
			expect( stubs.outputJson.getCall( 1 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 2 ).args[ 0 ] ).to.contain( '/ckeditor5-dev/packages/package-foo/package.json' );
			expect( stubs.outputJson.getCall( 2 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
			expect( stubs.outputJson.getCall( 3 ).args[ 0 ] ).to.equal( '/ckeditor5-dev/package.json' );
			expect( stubs.outputJson.getCall( 3 ).args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should update the version field in the root package when `packagesDirectory` is not provided', async () => {
			stubs.glob.resolves( [ '/ckeditor5-dev' ] );

			await updateVersions( { version: '1.0.1' } );

			expect( stubs.glob.callCount ).to.equal( 1 );
			expect( stubs.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json' ] );

			expect( stubs.outputJson.callCount ).to.equal( 1 );
			expect( stubs.outputJson.firstCall.args[ 0 ] ).to.contain( '/ckeditor5-dev' );
			expect( stubs.outputJson.firstCall.args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should throw an error when the version is already in use', async () => {
			stubs.readJson.resolves( { version: '1.0.0', name: 'stub-package' } );
			stubs.checkVersionAvailability.resolves( false );

			try {
				await updateVersions( { version: '1.0.1' } );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'The "stub-package@1.0.1" already exists in the npm registry.' );
			}
		} );

		it( 'should not throw an error when version is not in use', async () => {
			stubs.readJson.resolves( { version: '1.0.0', name: 'stub-package' } );
			stubs.checkVersionAvailability.resolves( true );

			try {
				await updateVersions( { version: '1.0.1' } );
			} catch ( err ) {
				throw new Error( 'Expected not to throw.' );
			}
		} );

		it( 'should throw an error when it was not possible to check the version availability', async () => {
			stubs.readJson.resolves( { version: '1.0.0', name: 'stub-package' } );
			stubs.checkVersionAvailability.rejects( new Error( 'Custom error.' ) );

			try {
				await updateVersions( { version: '1.0.1' } );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'Custom error.' );
			}
		} );

		it( 'should not use the root package name when checking version availability if `packagesDirectory` is provided', async () => {
			stubs.glob.resolves( [
				'/ckeditor5-dev/packages/package1/package.json',
				'/ckeditor5-dev/packages/package2/package.json',
				'/ckeditor5-dev/package.json'
			] );
			stubs.readJson.withArgs( '/ckeditor5-dev/packages/package1/package.json' ).resolves( { name: 'package1' } );
			stubs.readJson.withArgs( '/ckeditor5-dev/packages/package2/package.json' ).resolves( { name: 'package2' } );
			stubs.readJson.withArgs( '/ckeditor5-dev/package.json' ).resolves( { name: 'root-package' } );

			await updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( stubs.checkVersionAvailability.callCount ).to.equal( 1 );
			expect( stubs.checkVersionAvailability.firstCall.args[ 1 ] ).to.not.equal( 'root-package' );
		} );

		it( 'should use the root package name when checking version availability if `packagesDirectory` is not provided', async () => {
			stubs.glob.resolves( [ '/ckeditor5-dev/package.json' ] );
			stubs.readJson.withArgs( '/ckeditor5-dev/package.json' ).resolves( { name: 'root-package' } );

			await updateVersions( { version: '1.0.1' } );

			expect( stubs.checkVersionAvailability.callCount ).to.equal( 1 );
			expect( stubs.checkVersionAvailability.firstCall.args[ 1 ] ).to.equal( 'root-package' );
		} );

		it( 'should accept `0.0.0-nightly*` version for nightly releases', async () => {
			stubs.readJson.resolves( { version: '1.0.0', name: 'stub-package' } );

			try {
				await updateVersions( { version: '0.0.0-nightly-20230510.0' } );
			} catch ( err ) {
				throw new Error( 'Expected not to throw.' );
			}
		} );

		it( 'should throw when new version is not greater than the current one', async () => {
			stubs.readJson.resolves( { version: '1.0.1' } );

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

			expect( stubs.glob.firstCall.args[ 1 ] ).to.deep.equal( {
				cwd: 'Users/username/ckeditor5-dev/custom-dir',
				absolute: true,
				nodir: true
			} );
		} );
	} );
} );
