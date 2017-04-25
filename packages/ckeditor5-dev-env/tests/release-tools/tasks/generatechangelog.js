/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );
const changelogUtils = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/tasks', () => {
	describe( 'generateChangelog()', () => {
		let generateChangelog, sandbox, stubs, changelogBuffer, conventionalChangelogArguments;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				conventionalChangelog( ...args ) {
					conventionalChangelogArguments = args;

					return new class extends require( 'stream' ).Readable {
						_read() {
							if ( changelogBuffer instanceof Buffer ) {
								this.push( changelogBuffer );
							}

							this.push( null );
						}
					}();
				},
				fs: {
					existsSync: sandbox.stub( fs, 'existsSync' )
				},
				changelogUtils: {
					changelogFile: changelogUtils.changelogFile,
					changelogHeader: changelogUtils.changelogHeader,
					getChangelog: sandbox.stub(),
					saveChangelog: sandbox.stub()
				},
				getNewReleaseType: sandbox.stub(),
				hasCommitsFromLastRelease: sandbox.stub(),
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
				transformCommit: sandbox.spy()
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'conventional-changelog', stubs.conventionalChangelog );
			mockery.registerMock( '../utils/cli', stubs.cli );
			mockery.registerMock( '../utils/changelog', stubs.changelogUtils );
			mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
			mockery.registerMock( '../utils/hascommitsfromlastrelease', stubs.hasCommitsFromLastRelease );
			mockery.registerMock( '../utils/getwriteroptions', stubs.getWriterOptions );
			mockery.registerMock( '../utils/transformcommitforckeditor5package', stubs.transformCommit );
			mockery.registerMock( '../utils/getpackagejson', () => {
				return {
					name: 'test-package',
					version: '0.0.1'
				};
			} );

			generateChangelog = proxyquire( '../../../lib/release-tools/tasks/generatechangelog', {
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
			conventionalChangelogArguments = null;
		} );

		it( 'creates a changelog file if is not present', () => {
			changelogBuffer = Buffer.from( 'Changelog.' );

			stubs.fs.existsSync.returns( false );

			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			return generateChangelog( '1.0.0' )
				.then( () => {
					expect( stubs.changelogUtils.saveChangelog.calledTwice ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( changelogUtils.changelogHeader );

					expect( stubs.logger.warning.calledOnce ).to.equal( true );
					expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal( 'Changelog file does not exist. Creating...' );
				} );
		} );

		it( 'generates the changelog for given version', () => {
			const newChangelogChunk = [
				'## 1.0.0',
				'',
				'### Features',
				'',
				'* This test should pass!'
			].join( '\n' );

			changelogBuffer = Buffer.from( newChangelogChunk );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			stubs.getWriterOptions.returns( { foo: 'bar' } );

			return generateChangelog( '1.0.0' )
				.then( () => {
					expect( conventionalChangelogArguments ).to.be.an( 'array' );
					expect( conventionalChangelogArguments[ 4 ] ).to.deep.equal( { foo: 'bar' } );

					const newChangelog = changelogUtils.changelogHeader + newChangelogChunk + '\n';

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( newChangelog );

					expect( stubs.logger.info.calledThrice ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( '' );
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.match( /Generating changelog for "test-package".../ );
					expect( stubs.logger.info.thirdCall.args[ 0 ] ).to.match( /Changelog for "test-package" \(v1\.0\.0\) has been generated\./ );
				} );
		} );

		it( 'generates changelog for version provided by a user', () => {
			const newChangelogChunk = [
				'## 0.1.0',
				'',
				'### Features',
				'',
				'* This test should pass!'
			].join( '\n' );

			changelogBuffer = Buffer.from( newChangelogChunk );

			stubs.fs.existsSync.returns( true );

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor'
			} ) );

			stubs.hasCommitsFromLastRelease.returns( true );

			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			stubs.cli.provideVersion.returns( Promise.resolve( '0.1.0' ) );

			return generateChangelog()
				.then( () => {
					const newChangelog = changelogUtils.changelogHeader + newChangelogChunk + '\n';

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( newChangelog );

					expect( stubs.logger.info.calledThrice ).to.equal( true );
					expect( stubs.logger.info.thirdCall.args[ 0 ] ).to.match( /Changelog for "test-package" \(v0\.1\.0\) has been generated\./ );

					expect( stubs.hasCommitsFromLastRelease.calledOnce ).to.equal( true );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit );

					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );
				} );
		} );

		it( 'does not generate if a user provides "skip" as a new version', () => {
			stubs.fs.existsSync.returns( true );

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor'
			} ) );

			stubs.hasCommitsFromLastRelease.returns( false );
			stubs.cli.provideVersion.returns( Promise.resolve( 'skip' ) );

			return generateChangelog()
				.then( () => {
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit );
					expect( stubs.changelogUtils.saveChangelog.called ).to.equal( false );
				} );
		} );

		it( 'committed changelog should not trigger CI', () => {
			const newChangelogChunk = [
				'## 1.0.0',
				'',
				'### Features',
				'',
				'* This test should pass!'
			].join( '\n' );

			changelogBuffer = Buffer.from( newChangelogChunk );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			return generateChangelog( '1.0.0' )
				.then( () => {
					expect( stubs.tools.shExec.secondCall.args[ 0 ] ).to.equal( 'git commit -m "Docs: Changelog. [skip ci]"' );
				} );
		} );
	} );
} );
