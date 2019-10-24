/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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
			sandbox = sinon.createSandbox();

			stubs = {
				changelogUtils: {
					changelogFile: changelogUtils.changelogFile,
				},
				getNewReleaseType: sandbox.stub(),
				displayCommits: sandbox.stub(),
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
				transformCommitFactory: sandbox.stub(),
				transformCommit: [
					sandbox.stub(),
					sandbox.stub()
				],
				generateChangelogFromCommits: sandbox.stub(),
				versionUtils: {
					getLastFromChangelog: sandbox.stub()
				}
			};

			stubs.transformCommitFactory.onFirstCall().returns( stubs.transformCommit[ 0 ] );
			stubs.transformCommitFactory.onSecondCall().returns( stubs.transformCommit[ 1 ] );

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( '../utils/cli', stubs.cli );
			mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
			mockery.registerMock( '../utils/displaycommits', stubs.displayCommits );
			mockery.registerMock( '../utils/generatechangelogfromcommits', stubs.generateChangelogFromCommits );
			mockery.registerMock( '../utils/transform-commit/transformcommitforsubrepositoryfactory', stubs.transformCommitFactory );

			generateChangelogForSinglePackage = proxyquire( '../../../lib/release-tools/tasks/generatechangelogforsinglepackage', {
				'../utils/changelog': stubs.changelogUtils,
				'../utils/versions': stubs.versionUtils,
				'../utils/getpackagejson': () => ( {
					name: 'test-package',
					version: '0.0.1'
				} ),
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

		it( 'generates the changelog for specified version (user must confirm)', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor',
				commits
			} ) );

			stubs.versionUtils.getLastFromChangelog.returns( '0.5.0' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );
			stubs.cli.provideVersion.returns( Promise.resolve( '1.0.0' ) );

			return generateChangelogForSinglePackage( { newVersion: '1.0.0' } )
				.then( () => {
					expect( stubs.transformCommitFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.transformCommitFactory.secondCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.0.0',
						tagName: 'v0.5.0',
						newTagName: 'v1.0.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						skipLinks: false
					} );

					expect( stubs.logger.info.calledTwice ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match(
						/Generating changelog for "[^"]+".../
					);
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.match(
						/Changelog for "[^"]+" \(v1\.0\.0\) has been generated\./
					);
				} );
		} );

		it( 'generates changelog for version provided by a user', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor',
				commits
			} ) );
			stubs.cli.provideVersion.returns( Promise.resolve( '0.1.0' ) );
			stubs.versionUtils.getLastFromChangelog.returns( null );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.transformCommitFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.transformCommitFactory.secondCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						tagName: null,
						newTagName: 'v0.1.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						skipLinks: false
					} );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( {
						tagName: null
					} );

					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );

					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'generates changelog (as "patch" bump) for "internal" version provided by a user', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor',
				commits
			} ) );
			stubs.cli.provideVersion.returns( Promise.resolve( 'internal' ) );
			stubs.versionUtils.getLastFromChangelog.returns( null );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.transformCommitFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.transformCommitFactory.secondCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.0.2',
						tagName: null,
						newTagName: 'v0.0.2',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: true,
						skipLinks: false
					} );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( {
						tagName: null
					} );

					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );

					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( '"options.newVersion" can be defined as an increment level ', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor',
				commits
			} ) );
			stubs.cli.provideVersion.returns( Promise.resolve( '0.1.0' ) );
			stubs.versionUtils.getLastFromChangelog.returns( null );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( { newVersion: 'minor' } )
				.then( () => {
					expect( stubs.transformCommitFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.transformCommitFactory.secondCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						tagName: null,
						newTagName: 'v0.1.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						skipLinks: false
					} );

					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );

					expect( stubs.displayCommits.called ).to.equal( true );
				} );
		} );

		it( 'does not generate if a user provides "skip" as a new version (suggested a "minor" release)', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor',
				commits
			} ) );

			stubs.cli.provideVersion.returns( Promise.resolve( 'skip' ) );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.transformCommitFactory.calledOnce ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.called ).to.equal( false );

					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'does not generate if a user provides "skip" as a new version (suggested a "skip" release)', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'skip',
				commits
			} ) );

			stubs.cli.provideVersion.returns( Promise.resolve( 'skip' ) );

			return generateChangelogForSinglePackage()
				.then( () => {
					expect( stubs.transformCommitFactory.calledOnce ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.called ).to.equal( false );

					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'committed changelog should not trigger CI', () => {
			const commits = [ {}, {} ];

			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor',
				commits
			} ) );

			stubs.versionUtils.getLastFromChangelog.returns( '0.5.0' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );
			stubs.cli.provideVersion.returns( Promise.resolve( '1.0.0' ) );

			return generateChangelogForSinglePackage( { newVersion: '1.0.0' } )
				.then( () => {
					expect( stubs.tools.shExec.secondCall.args[ 0 ] ).to.equal(
						'git commit -m "Docs: Changelog. [skip ci]"'
					);
				} );
		} );

		it( 'allows generating changelog internal changelog (newVersion as a version string)', () => {
			stubs.versionUtils.getLastFromChangelog.returns( '0.0.1' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( { newVersion: '0.1.0', isInternalRelease: true } )
				.then( () => {
					expect( stubs.transformCommitFactory.calledOnce ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						tagName: 'v0.0.1',
						newTagName: 'v0.1.0',
						transformCommit: stubs.transformCommit[ 0 ],
						isInternalRelease: true,
						skipLinks: false
					} );
				} );
		} );

		it( 'allows generating changelog internal changelog (newVersion as an increment level)', () => {
			stubs.versionUtils.getLastFromChangelog.returns( '0.0.1' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( { newVersion: 'major', isInternalRelease: true } )
				.then( () => {
					expect( stubs.transformCommitFactory.calledOnce ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.0.0',
						tagName: 'v0.0.1',
						newTagName: 'v1.0.0',
						transformCommit: stubs.transformCommit[ 0 ],
						isInternalRelease: true,
						skipLinks: false
					} );
				} );
		} );

		it( 'throws an error for internal changelog when specified invalid value as newVersion', () => {
			stubs.versionUtils.getLastFromChangelog.returns( '0.0.1' );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( { newVersion: 'foo', isInternalRelease: true } )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					error => {
						expect( error.message ).to.equal(
							'If "isInternalRelease" is set on true, "newVersion" must be a version or increment level. Given "foo".'
						);
					}
				);
		} );

		it( 'passes the "skipLinks" option to the changelog generator', () => {
			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor'
			} ) );
			stubs.cli.provideVersion.returns( Promise.resolve( '0.1.0' ) );
			stubs.versionUtils.getLastFromChangelog.returns( null );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( { skipLinks: true } )
				.then( () => {
					expect( stubs.transformCommitFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: undefined
					} );
					expect( stubs.transformCommitFactory.secondCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: undefined
					} );

					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						tagName: null,
						newTagName: 'v0.1.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						skipLinks: true
					} );
				} );
		} );

		it( 'treats MAJOR BREAKING CHANGES as MINOR BREAKING CHANGES', () => {
			stubs.getNewReleaseType.returns( Promise.resolve( {
				releaseType: 'minor'
			} ) );
			stubs.cli.provideVersion.returns( Promise.resolve( '0.1.0' ) );
			stubs.versionUtils.getLastFromChangelog.returns( null );
			stubs.generateChangelogFromCommits.returns( Promise.resolve() );

			return generateChangelogForSinglePackage( { disableMajorBump: true } )
				.then( () => {
					expect( stubs.transformCommitFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true,
						treatMajorAsMinorBreakingChange: true
					} );
					expect( stubs.transformCommitFactory.secondCall.args[ 0 ] ).to.deep.equal( {
						treatMajorAsMinorBreakingChange: true
					} );

					expect( stubs.generateChangelogFromCommits.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						tagName: null,
						newTagName: 'v0.1.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						skipLinks: false
					} );
				} );
		} );
	} );
} );
