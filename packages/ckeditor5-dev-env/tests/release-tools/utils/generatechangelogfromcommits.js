/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );
const changelogUtils = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'generateChangelogFromCommits()', () => {
		let generateChangelogFromCommits, sandbox, stubs, changelogBuffer, conventionalChangelogArguments;

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
				logger: {
					info: sandbox.stub(),
					warning: sandbox.stub(),
					error: sandbox.stub()
				},
				getWriterOptions: sandbox.stub(),
				transformCommit: sandbox.stub()
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'conventional-changelog', stubs.conventionalChangelog );
			mockery.registerMock( './transform-commit/getwriteroptions', stubs.getWriterOptions );

			generateChangelogFromCommits = proxyquire( '../../../lib/release-tools/utils/generatechangelogfromcommits', {
				'./getpackagejson': () => ( {
					name: 'test-package',
					version: '0.0.1'
				} ),
				'./changelog': stubs.changelogUtils,
				'@ckeditor/ckeditor5-dev-utils': {
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

			const options = {
				version: '1.0.0',
				transformCommit: stubs.transformCommit
			};

			return generateChangelogFromCommits( options )
				.then( () => {
					expect( stubs.changelogUtils.saveChangelog.calledTwice ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] )
						.to.equal( changelogUtils.changelogHeader );

					expect( stubs.logger.warning.calledOnce ).to.equal( true );
					expect( stubs.logger.warning.firstCall.args[ 0 ] )
						.to.equal( 'Changelog file does not exist. Creating...' );
				} );
		} );

		it( 'does not create a changelog file if is not present but the "doNotSave" option is set on `true`', () => {
			changelogBuffer = Buffer.from( 'Changelog.' );

			stubs.fs.existsSync.returns( false );

			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			const options = {
				version: '1.0.0',
				transformCommit: stubs.transformCommit,
				doNotSave: true
			};

			return generateChangelogFromCommits( options )
				.then( () => {
					expect( stubs.changelogUtils.saveChangelog.called ).to.equal( false );
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

			const options = {
				version: '1.0.0',
				transformCommit: stubs.transformCommit,
				tagName: 'v0.5.0',
				newTagName: 'v1.0.0'
			};

			return generateChangelogFromCommits( options )
				.then( () => {
					expect( stubs.getWriterOptions.calledOnce ).to.equal( true );
					expect( stubs.getWriterOptions.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit );

					expect( conventionalChangelogArguments ).to.be.an( 'array' );
					expect( conventionalChangelogArguments[ 1 ] ).to.deep.equal( {
						displayLogs: false,
						version: '1.0.0',
						previousTag: 'v0.5.0',
						currentTag: 'v1.0.0',
						isInternalRelease: false,
						additionalNotes: {},
						linkCommit: true,
						linkCompare: true
					} );
					expect( conventionalChangelogArguments[ 2 ] ).to.have.property( 'from', 'v0.5.0' );
					expect( conventionalChangelogArguments[ 4 ] ).to.deep.equal( { foo: 'bar' } );

					const newChangelog = changelogUtils.changelogHeader + newChangelogChunk + '\n';

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( newChangelog );
				} );
		} );

		it( 'allows generating "internal" release', () => {
			changelogBuffer = Buffer.from( 'Internal changes only (updated dependencies, documentation, etc.).' );

			stubs.fs.existsSync.returns( true );
			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			const options = {
				version: '0.5.1',
				transformCommit: stubs.transformCommit,
				tagName: 'v0.5.0',
				newTagName: 'v0.5.1',
				isInternalRelease: true
			};

			return generateChangelogFromCommits( options )
				.then( () => {
					expect( conventionalChangelogArguments ).to.be.an( 'array' );
					expect( conventionalChangelogArguments[ 1 ] ).to.deep.equal( {
						displayLogs: false,
						version: '0.5.1',
						previousTag: 'v0.5.0',
						currentTag: 'v0.5.1',
						isInternalRelease: true,
						additionalNotes: {},
						linkCommit: true,
						linkCompare: true
					} );
				} );
		} );

		it( 'allows returning the changes instead of saving them', () => {
			const newChangelogChunk = [
				'## 1.0.0',
				'',
				'### Features',
				'',
				'* This test should pass!'
			].join( '\n' );

			changelogBuffer = Buffer.from( newChangelogChunk );

			stubs.fs.existsSync.returns( true );

			stubs.getWriterOptions.returns( { foo: 'bar' } );

			const options = {
				version: '1.0.0',
				transformCommit: stubs.transformCommit,
				tagName: 'v0.5.0',
				newTagName: 'v1.0.0',
				doNotSave: true
			};

			return generateChangelogFromCommits( options )
				.then( returnedChanges => {
					expect( returnedChanges ).to.equal( newChangelogChunk );
				} );
		} );

		it( 'allows appending additional notes for groups of commits', () => {
			changelogBuffer = Buffer.from( 'Changelog.' );

			stubs.fs.existsSync.returns( true );
			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			const options = {
				version: '0.5.1',
				transformCommit: stubs.transformCommit,
				tagName: 'v0.5.0',
				newTagName: 'v0.5.1',
				isInternalRelease: false,
				additionalNotes: true
			};

			return generateChangelogFromCommits( options )
				.then( () => {
					const { additionalCommitNotes } = require( '../../../lib/release-tools/utils/transform-commit/transform-commit-utils' );

					expect( conventionalChangelogArguments ).to.be.an( 'array' );
					expect( conventionalChangelogArguments[ 1 ] ).to.deep.equal( {
						displayLogs: false,
						version: '0.5.1',
						previousTag: 'v0.5.0',
						currentTag: 'v0.5.1',
						isInternalRelease: false,
						additionalNotes: additionalCommitNotes,
						linkCommit: true,
						linkCompare: true
					} );
				} );
		} );

		it( 'allows generating changelog without links to commits ("skipLinks" option)', () => {
			changelogBuffer = Buffer.from( 'Changelog.' );

			stubs.fs.existsSync.returns( true );
			stubs.changelogUtils.getChangelog.returns( changelogUtils.changelogHeader );

			const options = {
				version: '0.5.1',
				transformCommit: stubs.transformCommit,
				tagName: 'v0.5.0',
				newTagName: 'v0.5.1',
				skipLinks: true
			};

			return generateChangelogFromCommits( options )
				.then( () => {
					expect( conventionalChangelogArguments ).to.be.an( 'array' );
					expect( conventionalChangelogArguments[ 1 ] ).to.deep.equal( {
						displayLogs: false,
						version: '0.5.1',
						previousTag: 'v0.5.0',
						currentTag: 'v0.5.1',
						isInternalRelease: false,
						additionalNotes: {},
						linkCommit: false,
						linkCompare: false
					} );
				} );
		} );
	} );
} );
