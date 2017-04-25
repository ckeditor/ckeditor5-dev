/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );
const changelogUtils = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/tasks', () => {
	describe( 'generateChangelogForSinglePackage()', () => {
		let generateChangelogForSinglePackage, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				changelogUtils: {
					changelogFile: changelogUtils.changelogFile,
				},
				getNewReleaseType: sandbox.stub(),
				logger: {
					info: sandbox.stub(),
					warning: sandbox.stub(),
					error: sandbox.stub()
				},
				tools: {
					shExec: sandbox.stub()
				},
				cli: {
					provideVersion: sandbox.stub()
				},
				getWriterOptions: sandbox.stub(),
				transformCommit: sandbox.spy(),
				generateChangelogFromCommits: sandbox.stub(),
				versionUtils: {
					getLastFromChangelog: sandbox.stub()
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( '../utils/cli', stubs.cli );
			mockery.registerMock( '../utils/changelog', stubs.changelogUtils );
			mockery.registerMock( '../utils/versions', stubs.versionUtils );
			mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
			mockery.registerMock( '../utils/generatechangelogfromcommits', stubs.generateChangelogFromCommits );
			mockery.registerMock( '../utils/transform-commit/transformcommitforsubrepository', stubs.transformCommit );
			mockery.registerMock( '../utils/getpackagejson', () => {
				return {
					name: 'test-package',
					version: '0.0.1'
				};
			} );

			generateChangelogForSinglePackage = proxyquire( '../../../lib/release-tools/tasks/generatechangelogforsinglepackage', {
				'@ckeditor/ckeditor5-dev-utils': {
					tools: stubs.tools,
					logger() {
						return stubs.logger;
					}
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'generates the changelog for specified version', () => {
			stubs.versionUtils.getLastFromChangelog.returns( '0.5.0' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( '1.0.0' )
				.then( () => {
					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.0.0',
						tagName: 'v0.5.0',
						transformCommit: stubs.transformCommit
					} );

					expect( stubs.logger.info.calledThrice ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( '' );
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.match( /Generating changelog for "test-package".../ );
					expect( stubs.logger.info.thirdCall.args[ 0 ] ).to.match( /Changelog for "test-package" \(v1\.0\.0\) has been generated\./ );
				} );
		} );

		it( 'generates changelog for version provided by a user', () => {
			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor'
			} ) );
			stubs.cli.provideVersion.returns( Promise.resolve( '0.1.0' ) );
			stubs.versionUtils.getLastFromChangelog.returns( null );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						tagName: null,
						transformCommit: stubs.transformCommit
					} );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit );

					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );
				} );
		} );

		it( 'does not generate if a user provides "skip" as a new version (suggested a "minor" release)', () => {
			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor'
			} ) );

			stubs.cli.provideVersion.returns( Promise.resolve( 'skip' ) );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.generateChangelogFromCommits.called ).to.equal( false );
				} );
		} );

		it( 'does not generate if a user provides "skip" as a new version (suggested a "skip" release)', () => {
			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'skip'
			} ) );

			stubs.cli.provideVersion.returns( Promise.resolve( 'skip' ) );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.generateChangelogFromCommits.called ).to.equal( false );
				} );
		} );

		it( 'committed changelog should not trigger CI', () => {
			stubs.versionUtils.getLastFromChangelog.returns( '0.5.0' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( '1.0.0' )
				.then( () => {
					expect( stubs.tools.shExec.secondCall.args[ 0 ] ).to.equal( 'git commit -m "Docs: Changelog. [skip ci]"' );
				} );
		} );
	} );
} );
