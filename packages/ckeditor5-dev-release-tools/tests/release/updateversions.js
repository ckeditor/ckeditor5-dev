/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/release', () => {
	let updateVersions, sandbox, outputJsonSyncStub, getPackageJsonStub, syncStub, shExecStub, gtStub, validStub, readJsonSyncStub;

	describe( 'updateVersions()', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			outputJsonSyncStub = sandbox.stub();
			getPackageJsonStub = sandbox.stub().returns( { version: '1.0.0' } );
			readJsonSyncStub = sandbox.stub().returns( { version: '1.0.0' } );
			syncStub = sandbox.stub().returns( [ '/ckeditor5-dev' ] );
			shExecStub = sandbox.stub().throws( new Error( 'is not in this registry' ) );
			gtStub = sandbox.stub().returns( true );
			validStub = sandbox.stub().returns( true );

			updateVersions = proxyquire( '../../lib/release/updateversions.js', {
				'fs-extra': { writeJsonSync: outputJsonSyncStub, readJsonSync: readJsonSyncStub },
				'../utils/getpackagejson': getPackageJsonStub,
				'glob': { globSync: syncStub },
				'@ckeditor/ckeditor5-dev-utils': { tools: { shExec: shExecStub } },
				'semver': { gt: gtStub, valid: validStub }
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should call outputJsonSyncStub 4 times when the version is correct and there are 3 packages and 1 root', () => {
			syncStub.returns( [
				'/ckeditor5-dev/packages/package1',
				'/ckeditor5-dev/packages/package2',
				'/ckeditor5-dev/packages/package3',
				'/ckeditor5-dev'
			] );

			updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( syncStub.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json', 'packages/*/package.json' ] );
			expect( outputJsonSyncStub.callCount ).to.equal( 4 );
			expect( outputJsonSyncStub.firstCall.args[ 0 ] ).to.contain( 'package1' );
			expect( outputJsonSyncStub.firstCall.args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should call outputJsonSyncStub 1 time when the version is correct packages are undefined and 1 root', () => {
			syncStub.returns( [ '/ckeditor5-dev' ] );

			updateVersions( { version: '1.0.1' } );

			expect( syncStub.firstCall.args[ 0 ] ).to.deep.equal( [ 'package.json' ] );
			expect( outputJsonSyncStub.callCount ).to.equal( 1 );
			expect( outputJsonSyncStub.firstCall.args[ 0 ] ).to.contain( 'ckeditor5-dev' );
			expect( outputJsonSyncStub.firstCall.args[ 1 ] ).to.deep.equal( { version: '1.0.1' } );
		} );

		it( 'should throw when npm show returns that version is already in use', () => {
			getPackageJsonStub.returns( { version: '1.0.0', name: 'stub-package' } );
			shExecStub.returns( '' );

			expect( () => updateVersions( { version: '1.0.1' } ) )
				.to.throw( Error, 'Provided version 1.0.1 is already used in npm by stub-package' );
		} );

		it( 'should not throw when npm show returns that version is not in use', () => {
			shExecStub.throws( new Error( 'is not in this registry' ) );
			getPackageJsonStub.returns( { version: '1.0.0', name: 'stub-package' } );

			expect( () => updateVersions( { version: '1.0.1' } ) ).to.not.throw( Error );
		} );

		it( 'should throw when npm show throws another error', () => {
			shExecStub.throws( new Error( 'custom error' ) );
			getPackageJsonStub.returns( { version: '1.0.0', name: 'stub-package' } );

			expect( () => updateVersions( { version: '1.0.1' } ) ).to.throw( Error );
		} );

		it( 'should call outputJsonSyncStub when version is 0.0.0-', () => {
			updateVersions( { version: '0.0.0-nightly-123.0' } );

			expect( outputJsonSyncStub ).to.be.called;
		} );

		it( 'should throw when new version is not greater than old version', () => {
			gtStub.returns( false );

			expect( () => updateVersions( { version: '1.0.0' } ) )
				.to.throw( Error, 'Provided version 1.0.0 must be greater than 1.0.0.' );
		} );

		it( 'should throw when new version is not a valid semver version', () => {
			validStub.returns( false );

			expect( () => updateVersions( { version: '1.0.0' } ) )
				.to.throw( Error, 'Provided version 1.0.0 must be a valid semver version.' );
		} );

		it( 'should pass cwd to globSync', () => {
			updateVersions( { version: '1.0.1', cwd: 'Users/username/ckeditor5-dev/custom-dir' } );

			expect( syncStub.firstCall.args[ 1 ] ).to.deep.equal( {
				cwd: 'Users/username/ckeditor5-dev/custom-dir',
				absolute: true,
				nodir: true
			} );
		} );

		it( 'should pass path with "package1" to readJsonSync to search for random packages when packagesDirectory is defined', () => {
			syncStub.returns( [
				'/ckeditor5-dev/packages/package1',
				'/ckeditor5-dev'
			] );

			updateVersions( { version: '1.0.1', packagesDirectory: 'packages' } );

			expect( readJsonSyncStub.firstCall.args[ 0 ] ).to.contain( 'package1' );
		} );

		it( 'should pass "/ckeditor5-dev" to readJsonSync to search for random packages when packagesDirectory is undefined', () => {
			syncStub.returns( [ '/ckeditor5-dev' ] );

			updateVersions( { version: '1.0.1' } );

			expect( readJsonSyncStub.firstCall.args[ 0 ] ).to.equal( '/ckeditor5-dev' );
		} );
	} );
} );
