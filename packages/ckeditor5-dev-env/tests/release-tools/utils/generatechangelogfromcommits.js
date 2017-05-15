/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
			mockery.registerMock( './changelog', stubs.changelogUtils );
			mockery.registerMock( './transform-commit/getwriteroptions', stubs.getWriterOptions );
			mockery.registerMock( './getpackagejson', () => {
				return {
					name: 'test-package',
					version: '0.0.1'
				};
			} );

			generateChangelogFromCommits = proxyquire( '../../../lib/release-tools/utils/generatechangelogfromcommits', {
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
						currentTag: 'v1.0.0'
					} );
					expect( conventionalChangelogArguments[ 2 ] ).to.have.property( 'from', 'v0.5.0' );
					expect( conventionalChangelogArguments[ 4 ] ).to.deep.equal( { foo: 'bar' } );

					const newChangelog = changelogUtils.changelogHeader + newChangelogChunk + '\n';

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( newChangelog );
				} );
		} );
	} );
} );
