/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/release', () => {
	let updateVersions, sandbox, outputJsonSyncStub, getPackageJsonStub, syncStub, shExecStub, semverStub;

	describe( 'updateVersions()', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			outputJsonSyncStub = sandbox.stub();
			getPackageJsonStub = sandbox.stub();
			syncStub = sandbox.stub();
			shExecStub = sandbox.stub();
			semverStub = sandbox.stub();

			updateVersions = proxyquire( '../../lib/release/updateversions.js', {
				'fs-extra': { outputJsonSync: outputJsonSyncStub },
				'../utils/getpackagejson': getPackageJsonStub,
				'glob': { globSync: syncStub },
				'@ckeditor/ckeditor5-dev-utils': { tools: { shExec: shExecStub } },
				'semver': semverStub
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should call outputJsonSyncStub 4 times when the version is correct and there are 3 packages and 1 root', () => {
			shExecStub.throws( new Error( 'is not in this registry' ) );
			getPackageJsonStub.returns( { version: '1.0.0' } );
			syncStub.returns( [
				'/ckeditor5-dev/packages/package1',
				'/ckeditor5-dev/packages/package2',
				'/ckeditor5-dev/packages/package3',
				'/ckeditor5-dev'
			] );

			updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( syncStub.firstCall.args[ 0 ] ).to.deep.equal( [ 'packages/*', './' ] );
			expect( outputJsonSyncStub.callCount ).to.equal( 4 );
			expect( outputJsonSyncStub.firstCall.args[ 0 ] ).to.equal( '/ckeditor5-dev/packages/package1/package.json' );
			expect( outputJsonSyncStub.firstCall.args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should call outputJsonSyncStub 1 times when the version is correct packages are undefined and 1 root', () => {
			shExecStub.throws( new Error( 'is not in this registry' ) );
			getPackageJsonStub.returns( { version: '1.0.0' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );

			updateVersions( { version: '1.0.1' } );

			expect( syncStub.firstCall.args[ 0 ] ).to.equal( './' );
			expect( outputJsonSyncStub.callCount ).to.equal( 1 );
			expect( outputJsonSyncStub.firstCall.args[ 0 ] ).to.equal( '/ckeditor5-dev/package.json' );
			expect( outputJsonSyncStub.firstCall.args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should throw when shExec returns correct value', () => {
			getPackageJsonStub.returns( { version: '1.0.0', name: 'stub-package' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );
			shExecStub.returns( '' );

			expect( () => updateVersions( { version: '1.0.1' } ) )
				.to.throw( Error, 'Version 1.0.1 is already used in npm by stub-package' );
		} );

		it( 'should not throw when shExec throws is not in the registry error', () => {
			shExecStub.throws( new Error( 'is not in this registry' ) );
			getPackageJsonStub.returns( { version: '1.0.0', name: 'stub-package' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );

			expect( () => updateVersions( { version: '1.0.1' } ) ).to.not.throw( Error );
		} );

		it( 'should throw when shExec throws different error', () => {
			shExecStub.throws( new Error( 'custom error' ) );
			getPackageJsonStub.returns( { version: '1.0.0', name: 'stub-package' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );

			expect( () => updateVersions( { version: '1.0.1' } ) ).to.throw( Error );
		} );

		it( 'should throw error when the version is invalid', () => {
			getPackageJsonStub.returns( { version: '1.0.0' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );

			expect( () => updateVersions( { version: '123' } ) ).to.throw( Error );
		} );

		it( 'should call outputJsonSyncStub when version is 0.0.0-', () => {
			shExecStub.throws( new Error( 'is not in this registry' ) );
			getPackageJsonStub.returns( { version: '1.0.0' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );

			updateVersions( { version: '0.0.0-nightly-123.0' } );

			expect( outputJsonSyncStub ).to.be.called;
		} );

		it( 'should pass cwd to globSync', () => {
			shExecStub.throws( new Error( 'is not in this registry' ) );
			getPackageJsonStub.returns( { version: '1.0.0' } );
			syncStub.returns( [ '/ckeditor5-dev' ] );

			updateVersions( { version: '1.0.1', cwd: 'Users/username/ckeditor5-dev/custom-dir' } );

			expect( syncStub.firstCall.args[ 1 ] ).to.deep.equal( { cwd: 'Users/username/ckeditor5-dev/custom-dir', absolute: true } );
		} );
	} );
} );
