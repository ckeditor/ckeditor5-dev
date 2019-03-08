/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'releaseRepository()', () => {
		let releaseRepository, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				releaseRepositoryUtil: sandbox.stub(),
				validatePackageToRelease: sandbox.stub(),
				changelog: {
					getChangesForVersion: sandbox.stub()
				},
				cli: {
					configureReleaseOptions: sandbox.stub()
				},
				versionUtils: {
					getLastTagFromGit: sandbox.stub(),
					getLastFromChangelog: sandbox.stub()
				},
				logger: {
					info: sandbox.spy(),
					warning: sandbox.spy(),
					error: sandbox.spy()
				},
				shExec: sandbox.stub()
			};

			mockery.registerMock( '../utils/versions', stubs.versionUtils );
			mockery.registerMock( '../utils/releaserepository', stubs.releaseRepositoryUtil );
			mockery.registerMock( '../utils/validatepackagetorelease', stubs.validatePackageToRelease );
			mockery.registerMock( '../utils/cli', stubs.cli );

			releaseRepository = proxyquire( '../../../lib/release-tools/tasks/releaserepository', {
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
						return stubs.logger;
					},
					tools: {
						shExec: stubs.shExec
					}
				},
				'../utils/changelog': stubs.changelog
			} );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'informs if the changelog has not generated before releasing the package', () => {
			stubs.versionUtils.getLastTagFromGit.returns( '1.0.0' );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );

			return releaseRepository()
				.then( () => {
					expect( stubs.versionUtils.getLastFromChangelog.calledOnce ).to.equal( true );
					expect( stubs.versionUtils.getLastFromChangelog.calledOnce ).to.equal( true );

					expect( stubs.logger.warning.calledOnce ).to.equal( true );
					expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal(
						'Before starting the release process, you should generate the changelog.'
					);
				} );
		} );

		it( 'informs if a user is not logged', () => {
			stubs.versionUtils.getLastTagFromGit.returns( null );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelog.getChangesForVersion.returns( null );
			stubs.shExec.throws();

			stubs.validatePackageToRelease.returns( [
				'Some error.'
			] );

			return releaseRepository()
				.then( () => {
					expect( stubs.logger.info.calledOnce ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal(
						'Checking whether you are logged to npm...'
					);
					expect( stubs.logger.warning.calledOnce ).to.equal( true );
					expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal(
						'This command requires you to be logged in.'
					);
				} );
		} );

		it( 'informs if validation did not pass', () => {
			stubs.versionUtils.getLastTagFromGit.returns( null );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelog.getChangesForVersion.returns( null );
			stubs.shExec.returns( 'foo' );
			stubs.validatePackageToRelease.returns( [
				'Some error.'
			] );

			return releaseRepository()
				.then( () => {
					expect( stubs.validatePackageToRelease.calledOnce ).to.equal( true );
					expect( stubs.validatePackageToRelease.firstCall.args[ 0 ] ).to.deep.equal( {
						changes: null,
						version: '1.0.0'
					} );
					expect( stubs.logger.info.calledTwice ).to.equal( true );
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.match( /Logged as/ );
					expect( stubs.logger.warning.calledOnce ).to.equal( true );
					expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal(
						'Releasing has been aborted due to errors.'
					);
					expect( stubs.logger.error.calledTwice ).to.equal( true );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( 'Unexpected errors occured:' );
					expect( stubs.logger.error.secondCall.args[ 0 ] ).to.equal( '* Some error.' );
				} );
		} );

		it( 'release package if everything is ok', () => {
			stubs.versionUtils.getLastTagFromGit.returns( null );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelog.getChangesForVersion.returns( 'Changes.' );
			stubs.shExec.returns( 'foo' );
			stubs.validatePackageToRelease.returns( [] );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				token: 'foo',
				skipNpm: true,
				skipGithub: false
			} ) );
			stubs.releaseRepositoryUtil.returns( Promise.resolve() );

			return releaseRepository()
				.then( () => {
					expect( stubs.validatePackageToRelease.calledOnce ).to.equal( true );
					expect( stubs.validatePackageToRelease.firstCall.args[ 0 ] ).to.deep.equal( {
						changes: 'Changes.',
						version: '1.0.0'
					} );

					expect( stubs.cli.configureReleaseOptions.calledOnce ).to.equal( true );
					expect( stubs.releaseRepositoryUtil.calledOnce ).to.equal( true );
					expect( stubs.releaseRepositoryUtil.firstCall.args[ 0 ] ).to.deep.equal( {
						changes: 'Changes.',
						version: '1.0.0',
						token: 'foo',
						skipNpm: true,
						skipGithub: false
					} );
				} );
		} );

		it( 'changes "exitCode" if something went wrong during the release process', () => {
			const exitCode = process.exitCode;
			const error = new Error( 'Unexpected error.' );

			stubs.versionUtils.getLastTagFromGit.returns( null );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelog.getChangesForVersion.returns( 'Changes.' );
			stubs.shExec.returns( 'foo' );
			stubs.validatePackageToRelease.returns( [] );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				token: 'foo',
				skipNpm: true,
				skipGithub: false
			} ) );
			stubs.releaseRepositoryUtil.rejects( error );

			return releaseRepository()
				.then(
					() => {
						expect( process.exitCode ).to.equal( -1 );
						expect( stubs.logger.error.calledOnce ).to.equal( true );
						expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( error.message );

						// Restore the `exitCode` to the state before calling this test.
						process.exitCode = exitCode;
					} );
		} );
	} );
} );
