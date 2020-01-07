/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	let generateChangelogForSubPackages, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			transformCommitFunctionFactory: sandbox.stub(),
			transformCommit: [],
			getSubPackagesPaths: sandbox.stub(),
			displaySkippedPackages: sandbox.stub(),
			displayGeneratedChangelogs: sandbox.stub(),
			generateChangelogFromCommits: sandbox.stub(),
			getPackageJson: sandbox.stub(),
			changelogUtils: {
				changelogFile: 'CHANGELOG.md',
			},
			getNewReleaseType: sandbox.stub(),
			displayCommits: sandbox.stub(),
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			tools: {
				shExec: sandbox.stub()
			},
			cli: {
				provideVersion: sandbox.stub()
			},
			versionUtils: {
				getLastFromChangelog: sandbox.stub()
			}
		};

		for ( let i = 0; i < 4; ++i ) {
			stubs.transformCommit.push( sandbox.stub() );
			stubs.transformCommitFunctionFactory.onCall( i ).returns( stubs.transformCommit[ i ] );
		}

		mockery.registerMock( '../utils/transform-commit/transformcommitforsubpackagefactory', stubs.transformCommitFunctionFactory );
		mockery.registerMock( '../utils/generatechangelogfromcommits', stubs.generateChangelogFromCommits );
		mockery.registerMock( '../utils/getsubpackagespaths', stubs.getSubPackagesPaths );
		mockery.registerMock( '../utils/displayskippedpackages', stubs.displaySkippedPackages );
		mockery.registerMock( '../utils/displaygeneratedchangelogs', stubs.displayGeneratedChangelogs );
		mockery.registerMock( '../utils/cli', stubs.cli );
		mockery.registerMock( '../utils/versions', stubs.versionUtils );
		mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
		mockery.registerMock( '../utils/displaycommits', stubs.displayCommits );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		generateChangelogForSubPackages = proxyquire( '../../../lib/release-tools/tasks/generatechangelogforsubpackages', {
			'@ckeditor/ckeditor5-dev-utils': {
				tools: stubs.tools,
				logger() {
					return stubs.logger;
				}
			},
			'../utils/getpackagejson': stubs.getPackageJson,
			'../utils/changelog': stubs.changelogUtils
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'generateChangelogForSubPackages()', () => {
		it( 'generates changelog entries for found sub packages', () => {
			const commits = [ {}, {} ];
			const chdirStub = sandbox.stub( process, 'chdir' );
			sandbox.stub( process, 'cwd' ).returns( '/ckeditor5-dev' );

			stubs.getSubPackagesPaths.returns( {
				skipped: new Set(),
				matched: new Set( [
					'/ckeditor5-dev/packages/ckeditor5-dev-foo',
					'/ckeditor5-dev/packages/ckeditor5-dev-bar'
				] )
			} );

			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-dev-foo',
				version: '1.0.0'
			} );
			stubs.versionUtils.getLastFromChangelog.onFirstCall().returns( '1.0.0' );
			stubs.getNewReleaseType.onFirstCall().returns( Promise.resolve( { commits, releaseType: 'patch' } ) );
			stubs.cli.provideVersion.onFirstCall().returns( Promise.resolve( '1.0.1' ) );
			stubs.generateChangelogFromCommits.onFirstCall().returns( Promise.resolve( '1.0.1' ) );

			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-dev-bar',
				version: '2.0.0'
			} );
			stubs.versionUtils.getLastFromChangelog.onSecondCall().returns( '2.0.0' );
			stubs.getNewReleaseType.onSecondCall().returns( Promise.resolve( { commits, releaseType: 'minor' } ) );
			stubs.cli.provideVersion.onSecondCall().returns( Promise.resolve( '2.1.0' ) );
			stubs.generateChangelogFromCommits.onSecondCall().returns( Promise.resolve( '2.1.0' ) );

			const generatedChangelogs = new Map( [
				[ '@ckeditor/ckeditor5-dev-foo', '1.0.1' ],
				[ '@ckeditor/ckeditor5-dev-bar', '2.1.0' ]
			] );

			const options = {
				cwd: '/ckeditor5-dev',
				packages: 'packages'
			};

			return generateChangelogForSubPackages( options )
				.then( () => {
					expect( chdirStub.calledThrice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/ckeditor5-dev/packages/ckeditor5-dev-foo' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/ckeditor5-dev/packages/ckeditor5-dev-bar' );
					expect( chdirStub.thirdCall.args[ 0 ] ).to.equal( '/ckeditor5-dev' );

					expect( stubs.getNewReleaseType.calledTwice ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( {
						tagName: '@ckeditor/ckeditor5-dev-foo@1.0.0'
					} );
					expect( stubs.getNewReleaseType.secondCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 2 ] );
					expect( stubs.getNewReleaseType.secondCall.args[ 1 ] ).to.deep.equal( {
						tagName: '@ckeditor/ckeditor5-dev-bar@2.0.0'
					} );

					expect( stubs.cli.provideVersion.calledTwice ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '1.0.0' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( 'patch' );
					expect( stubs.cli.provideVersion.secondCall.args[ 0 ] ).to.equal( '2.0.0' );
					expect( stubs.cli.provideVersion.secondCall.args[ 1 ] ).to.equal( 'minor' );

					expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.match(
						/Generating changelog for "@ckeditor\/ckeditor5-dev-foo"\.\.\./
					);
					expect( stubs.logger.info.getCall( 2 ).args[ 0 ] ).to.match(
						/Generating changelog for "@ckeditor\/ckeditor5-dev-bar"\.\.\./
					);
					expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.match( /Committing generated changelogs\./ );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );
					expect( stubs.displayGeneratedChangelogs.firstCall.args[ 0 ] ).to.deep.equal( generatedChangelogs );

					expect( stubs.tools.shExec.calledTwice ).to.equal( true );
					expect( stubs.tools.shExec.firstCall.args[ 0 ] ).to.equal( 'git add packages/**/CHANGELOG.md' );
					expect( stubs.tools.shExec.secondCall.args[ 0 ] ).to.equal(
						'git commit -m "Docs: Updated changelog for packages. [skip ci]"'
					);

					expect( stubs.generateChangelogFromCommits.calledTwice ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.0.1',
						transformCommit: stubs.transformCommit[ 1 ],
						tagName: '@ckeditor/ckeditor5-dev-foo@1.0.0',
						newTagName: '@ckeditor/ckeditor5-dev-foo@1.0.1',
						isInternalRelease: false
					} );
					expect( stubs.generateChangelogFromCommits.secondCall.args[ 0 ] ).to.deep.equal( {
						version: '2.1.0',
						transformCommit: stubs.transformCommit[ 3 ],
						tagName: '@ckeditor/ckeditor5-dev-bar@2.0.0',
						newTagName: '@ckeditor/ckeditor5-dev-bar@2.1.0',
						isInternalRelease: false
					} );

					expect( stubs.displayCommits.calledTwice ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
					expect( stubs.displayCommits.secondCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'ignores specified packages', () => {
			const commits = [ {}, {} ];
			const chdirStub = sandbox.stub( process, 'chdir' );
			sandbox.stub( process, 'cwd' ).returns( '/ckeditor5-dev' );

			stubs.getSubPackagesPaths.returns( {
				skipped: new Set( [
					'/ckeditor5-dev/packages/ckeditor5-dev-bar'
				] ),
				matched: new Set( [
					'/ckeditor5-dev/packages/ckeditor5-dev-foo',
				] )
			} );

			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-dev-foo',
				version: '1.0.0'
			} );
			stubs.versionUtils.getLastFromChangelog.onFirstCall().returns( '1.0.0' );
			stubs.getNewReleaseType.onFirstCall().returns( Promise.resolve( { commits, releaseType: 'patch' } ) );
			stubs.cli.provideVersion.onFirstCall().returns( Promise.resolve( '1.0.1' ) );
			stubs.generateChangelogFromCommits.onFirstCall().returns( Promise.resolve( '1.0.1' ) );

			const options = {
				cwd: '/ckeditor5-dev',
				packages: 'packages'
			};

			return generateChangelogForSubPackages( options )
				.then( () => {
					expect( chdirStub.calledTwice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/ckeditor5-dev/packages/ckeditor5-dev-foo' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/ckeditor5-dev' );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );

					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );
					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.deep.equal( new Set( [
						'/ckeditor5-dev/packages/ckeditor5-dev-bar'
					] ) );

					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.0.1',
						transformCommit: stubs.transformCommit[ 1 ],
						tagName: '@ckeditor/ckeditor5-dev-foo@1.0.0',
						newTagName: '@ckeditor/ckeditor5-dev-foo@1.0.1',
						isInternalRelease: false
					} );

					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'displays packages which will not have a new entry in changelog', () => {
			const chdirStub = sandbox.stub( process, 'chdir' );
			sandbox.stub( process, 'cwd' ).returns( '/ckeditor5-dev' );

			stubs.getSubPackagesPaths.returns( {
				skipped: new Set(),
				matched: new Set( [
					'/ckeditor5-dev/packages/ckeditor5-dev-foo',
				] )
			} );

			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-dev-foo',
				version: '1.0.0'
			} );
			stubs.versionUtils.getLastFromChangelog.onFirstCall().returns( '1.0.0' );
			stubs.getNewReleaseType.onFirstCall().returns( Promise.resolve( { releaseType: 'skip' } ) );
			stubs.cli.provideVersion.onFirstCall().returns( Promise.resolve( 'skip' ) );

			const options = {
				cwd: '/ckeditor5-dev',
				packages: 'packages'
			};

			return generateChangelogForSubPackages( options )
				.then( () => {
					expect( chdirStub.calledTwice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.equal( '/ckeditor5-dev/packages/ckeditor5-dev-foo' );
					expect( chdirStub.secondCall.args[ 0 ] ).to.equal( '/ckeditor5-dev' );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.calledOnce ).to.equal( true );
					expect( stubs.cli.provideVersion.firstCall.args[ 0 ] ).to.equal( '1.0.0' );
					expect( stubs.cli.provideVersion.firstCall.args[ 1 ] ).to.equal( null );

					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );
					expect( stubs.displaySkippedPackages.firstCall.args[ 0 ] ).to.deep.equal( new Set( [
						'/ckeditor5-dev/packages/ckeditor5-dev-foo'
					] ) );

					expect( stubs.tools.shExec.called ).to.equal( false );
					expect( stubs.generateChangelogFromCommits.called ).to.equal( false );
				} );
		} );

		it( 'allows generating changelog as "internal" release', () => {
			sandbox.stub( process, 'chdir' );
			sandbox.stub( process, 'cwd' ).returns( '/ckeditor5-dev' );

			stubs.getSubPackagesPaths.returns( {
				skipped: new Set(),
				matched: new Set( [
					'/ckeditor5-dev/packages/ckeditor5-dev-foo',
					'/ckeditor5-dev/packages/ckeditor5-dev-bar'
				] )
			} );

			stubs.getPackageJson.onFirstCall().returns( {
				name: '@ckeditor/ckeditor5-dev-foo',
				version: '1.0.0'
			} );
			stubs.versionUtils.getLastFromChangelog.onFirstCall().returns( '1.0.0' );
			stubs.getNewReleaseType.onFirstCall().returns( Promise.resolve( { releaseType: 'patch' } ) );
			stubs.cli.provideVersion.onFirstCall().returns( Promise.resolve( 'internal' ) );
			stubs.generateChangelogFromCommits.onFirstCall().returns( Promise.resolve( '1.0.1' ) );

			stubs.getPackageJson.onSecondCall().returns( {
				name: '@ckeditor/ckeditor5-dev-bar',
				version: '2.0.0'
			} );
			stubs.versionUtils.getLastFromChangelog.onSecondCall().returns( '2.0.0' );
			stubs.getNewReleaseType.onSecondCall().returns( Promise.resolve( { releaseType: 'minor' } ) );
			stubs.cli.provideVersion.onSecondCall().returns( Promise.resolve( 'internal' ) );
			stubs.generateChangelogFromCommits.onSecondCall().returns( Promise.resolve( '2.0.1' ) );

			const options = {
				cwd: '/ckeditor5-dev',
				packages: 'packages'
			};

			return generateChangelogForSubPackages( options )
				.then( () => {
					expect( stubs.generateChangelogFromCommits.calledTwice ).to.equal( true );
					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.0.1',
						transformCommit: stubs.transformCommit[ 1 ],
						tagName: '@ckeditor/ckeditor5-dev-foo@1.0.0',
						newTagName: '@ckeditor/ckeditor5-dev-foo@1.0.1',
						isInternalRelease: true
					} );
					expect( stubs.generateChangelogFromCommits.secondCall.args[ 0 ] ).to.deep.equal( {
						version: '2.0.1',
						transformCommit: stubs.transformCommit[ 3 ],
						tagName: '@ckeditor/ckeditor5-dev-bar@2.0.0',
						newTagName: '@ckeditor/ckeditor5-dev-bar@2.0.1',
						isInternalRelease: true
					} );
				} );
		} );
	} );
} );
