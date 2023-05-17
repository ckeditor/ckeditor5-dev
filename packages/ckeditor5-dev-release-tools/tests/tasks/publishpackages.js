/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const upath = require( 'upath' );

describe( 'dev-release-tools/tasks', () => {
	describe( 'publishPackages()', () => {
		let publishPackages, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				glob: {
					glob: sandbox.stub().resolves( [] )
				},
				assertNpmAuthorization: sandbox.stub().resolves(),
				assertPackages: sandbox.stub().resolves(),
				assertNpmTag: sandbox.stub().resolves(),
				assertFilesToPublish: sandbox.stub().resolves(),
				publishPackagesOnNpm: sandbox.stub().resolves()
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'glob', stubs.glob );
			mockery.registerMock( '../utils/assertnpmauthorization', stubs.assertNpmAuthorization );
			mockery.registerMock( '../utils/assertpackages', stubs.assertPackages );
			mockery.registerMock( '../utils/assertnpmtag', stubs.assertNpmTag );
			mockery.registerMock( '../utils/assertfilestopublish', stubs.assertFilesToPublish );
			mockery.registerMock( '../utils/publishpackagesonnpm', stubs.publishPackagesOnNpm );

			publishPackages = require( '../../lib/tasks/publishpackages' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should not throw if all assertion passes', () => {
			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} );
		} );

		it( 'should read the package directory (default `cwd`)', () => {
			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.glob.glob.callCount ).to.equal( 1 );
				expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.equal( '*/' );
				expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', upath.join( process.cwd(), 'packages' ) );
				expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'absolute', true );
			} );
		} );

		it( 'should read the package directory (custom `cwd`)', () => {
			sandbox.stub( process, 'cwd' ).returns( '/work/project' );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.glob.glob.callCount ).to.equal( 1 );
				expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.equal( '*/' );
				expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', '/work/project/packages' );
				expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'absolute', true );
			} );
		} );

		it( 'should assert npm authorization', () => {
			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.assertNpmAuthorization.callCount ).to.equal( 1 );
				expect( stubs.assertNpmAuthorization.firstCall.args[ 0 ] ).to.equal( 'pepe' );
			} );
		} );

		it( 'should throw if npm authorization assertion failed', () => {
			stubs.assertNpmAuthorization.throws( new Error( 'You must be logged to npm as "pepe" to execute this release step.' ) );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'You must be logged to npm as "pepe" to execute this release step.'
					);
				} );
		} );

		it( 'should assert that each found directory is a package', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.assertPackages.callCount ).to.equal( 1 );
				expect( stubs.assertPackages.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
			} );
		} );

		it( 'should throw if package assertion failed', () => {
			stubs.assertPackages.throws( new Error( 'The "package.json" file is missing in the "ckeditor5-foo" package.' ) );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'The "package.json" file is missing in the "ckeditor5-foo" package.'
					);
				} );
		} );

		it( 'should assert that each required file exists in the package directory (no optional entries)', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.assertFilesToPublish.callCount ).to.equal( 1 );
				expect( stubs.assertFilesToPublish.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.assertFilesToPublish.firstCall.args[ 1 ] ).to.equal( null );
			} );
		} );

		it( 'should assert that each required file exists in the package directory (with optional entries)', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				optionalEntries: {
					'ckeditor5-foo': [ 'src' ]
				}
			} ).then( () => {
				expect( stubs.assertFilesToPublish.callCount ).to.equal( 1 );
				expect( stubs.assertFilesToPublish.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.assertFilesToPublish.firstCall.args[ 1 ] ).to.deep.equal( {
					'ckeditor5-foo': [ 'src' ]
				} );
			} );
		} );

		it( 'should throw if not all required files exist in the package directory', () => {
			stubs.assertFilesToPublish.throws( new Error( 'Missing files in "ckeditor5-foo" package for entries: "src"' ) );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'Missing files in "ckeditor5-foo" package for entries: "src"'
					);
				} );
		} );

		it( 'should assert that version tag matches the npm tag (default npm tag)', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.assertNpmTag.callCount ).to.equal( 1 );
				expect( stubs.assertNpmTag.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.assertNpmTag.firstCall.args[ 1 ] ).to.equal( 'staging' );
			} );
		} );

		it( 'should assert that version tag matches the npm tag (custom npm tag)', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				npmTag: 'nightly'
			} ).then( () => {
				expect( stubs.assertNpmTag.callCount ).to.equal( 1 );
				expect( stubs.assertNpmTag.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.assertNpmTag.firstCall.args[ 1 ] ).to.equal( 'nightly' );
			} );
		} );

		it( 'should throw if version tag does not match the npm tag', () => {
			stubs.assertNpmTag.throws(
				new Error( 'The version tag "rc" from "ckeditor5-foo" package does not match the npm tag "staging".' )
			);

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal(
						'The version tag "rc" from "ckeditor5-foo" package does not match the npm tag "staging".'
					);
				} );
		} );

		it( 'should publish packages on npm if confirmation callback is not set (default npm tag)', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then( () => {
				expect( stubs.publishPackagesOnNpm.callCount ).to.equal( 1 );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 1 ] ).to.equal( 'staging' );
			} );
		} );

		it( 'should publish packages on npm if confirmation callback is not set (custom npm tag)', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				npmTag: 'nightly'
			} ).then( () => {
				expect( stubs.publishPackagesOnNpm.callCount ).to.equal( 1 );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 1 ] ).to.equal( 'nightly' );
			} );
		} );

		it( 'should publish packages on npm if synchronous confirmation callback returns truthy value', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			const confirmationCallback = sandbox.stub().returns( true );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback
			} ).then( () => {
				expect( stubs.publishPackagesOnNpm.callCount ).to.equal( 1 );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 1 ] ).to.equal( 'staging' );

				expect( confirmationCallback.callCount ).to.equal( 1 );
			} );
		} );

		it( 'should publish packages on npm if asynchronous confirmation callback returns truthy value', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			const confirmationCallback = sandbox.stub().resolves( true );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback
			} ).then( () => {
				expect( stubs.publishPackagesOnNpm.callCount ).to.equal( 1 );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 0 ] ).to.deep.equal( [
					'/work/project/packages/ckeditor5-foo',
					'/work/project/packages/ckeditor5-bar'
				] );
				expect( stubs.publishPackagesOnNpm.firstCall.args[ 1 ] ).to.equal( 'staging' );

				expect( confirmationCallback.callCount ).to.equal( 1 );
			} );
		} );

		it( 'should not publish packages on npm if synchronous confirmation callback returns falsy value', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			const confirmationCallback = sandbox.stub().returns( false );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback
			} ).then( () => {
				expect( stubs.publishPackagesOnNpm.callCount ).to.equal( 0 );
				expect( confirmationCallback.callCount ).to.equal( 1 );
			} );
		} );

		it( 'should not publish packages on npm if asynchronous confirmation callback returns falsy value', () => {
			stubs.glob.glob.resolves( [
				'/work/project/packages/ckeditor5-foo',
				'/work/project/packages/ckeditor5-bar'
			] );

			const confirmationCallback = sandbox.stub().resolves( false );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe',
				confirmationCallback
			} ).then( () => {
				expect( stubs.publishPackagesOnNpm.callCount ).to.equal( 0 );
				expect( confirmationCallback.callCount ).to.equal( 1 );
			} );
		} );

		it( 'should throw if publishing packages on npm failed', () => {
			stubs.publishPackagesOnNpm.throws( new Error( 'Unable to publish "ckeditor5-foo" package.' ) );

			return publishPackages( {
				packagesDirectory: 'packages',
				npmOwner: 'pepe'
			} ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).to.be.an( 'Error' );
					expect( error.message ).to.equal( 'Unable to publish "ckeditor5-foo" package.' );
				} );
		} );
	} );
} );
