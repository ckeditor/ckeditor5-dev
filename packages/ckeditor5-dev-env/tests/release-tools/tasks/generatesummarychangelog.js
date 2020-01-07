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
const executeOnPackages = require( '../../../lib/release-tools/utils/executeonpackages' );

const mainPackagePath = path.join( __dirname, 'stubs', 'releasesubrepositories' );
const packagesPaths = {
	alpha: path.join( mainPackagePath, 'packages', 'alpha' ),
	beta: path.join( mainPackagePath, 'packages', 'beta' ),
	gamma: path.join( mainPackagePath, 'packages', 'gamma' ),
	delta: path.join( mainPackagePath, 'packages', 'delta' ),
	epsilon: path.join( mainPackagePath, 'packages', 'epsilon' ),
	omega: path.join( mainPackagePath, 'packages', 'omega' ),
	devKappa: path.join( mainPackagePath, 'packages', 'dev-kappa' )
};

const testCwd = process.cwd();

// Tests below use real files (as mocks). See: "/packages/ckeditor5-dev-env/tests/release-tools/tasks/stubs/releasesubrepositories".
// `console.log` calls are mocked (See L85) because the task at the end prints an empty line which breaks the test logs.
describe( 'dev-env/release-tools/tasks', () => {
	let generateSummaryChangelog, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			shExec: sandbox.stub(),
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			versionUtils: {
				getLastFromChangelog: sandbox.stub(),
				getCurrent: sandbox.stub(),
			},
			cliUtils: {
				provideVersion: sandbox.stub(),
			},
			changelogUtils: {
				getChangelog: sandbox.stub(),
				saveChangelog: sandbox.stub(),
				hasMajorBreakingChanges: sandbox.stub(),
				hasMinorBreakingChanges: sandbox.stub(),
				changelogHeader: ''
			},
			displayGeneratedChangelogs: sandbox.stub(),
			getSubRepositoriesPaths: sandbox.stub(),
			transformCommitFunctionFactory: sandbox.stub(),
			transformCommit: [
				sandbox.stub(),
				sandbox.stub()
			],
			generateChangelogFromCommits: sandbox.stub(),
			getNewReleaseType: sandbox.stub(),
			displayCommits: sandbox.stub(),
			executeOnPackages: sandbox.stub(),
			moment: {
				format: sandbox.stub()
			},
			fs: {
				existsSync: sandbox.stub()
			}
		};

		stubs.transformCommitFunctionFactory.onFirstCall().returns( stubs.transformCommit[ 0 ] );
		stubs.transformCommitFunctionFactory.onSecondCall().returns( stubs.transformCommit[ 1 ] );

		sandbox.stub( console, 'log' );

		mockery.registerMock( 'moment', () => stubs.moment );
		mockery.registerMock( '../utils/displaygeneratedchangelogs', stubs.displayGeneratedChangelogs );
		mockery.registerMock( '../utils/transform-commit/transformcommitforsubrepositoryfactory', stubs.transformCommitFunctionFactory );
		mockery.registerMock( '../utils/generatechangelogfromcommits', stubs.generateChangelogFromCommits );
		mockery.registerMock( '../utils/executeonpackages', stubs.executeOnPackages );
		mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
		mockery.registerMock( '../utils/displaycommits', stubs.displayCommits );
		mockery.registerMock( '../utils/versions', stubs.versionUtils );
		mockery.registerMock( '../utils/cli', stubs.cliUtils );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		generateSummaryChangelog = proxyquire( '../../../lib/release-tools/tasks/generatesummarychangelog', {
			fs: stubs.fs,
			'@ckeditor/ckeditor5-dev-utils': {
				tools: {
					shExec: stubs.shExec
				},
				logger() {
					return stubs.logger;
				}
			},
			'../utils/changelog': stubs.changelogUtils,
			'../utils/getsubrepositoriespaths': stubs.getSubRepositoriesPaths
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'generateSummaryChangelog()', () => {
		it( 'generates a summary changelog for single package', () => {
			const commits = [ {}, {} ];

			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.alpha
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.1' );

			// Minor release (no minor breaking changes).
			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.4.0' );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.4.0', packagesPaths.gamma ).returns( false );

			// Major release (no major breaking changes).
			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '1.0.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '1.0.0', packagesPaths.epsilon ).returns( false );

			stubs.getNewReleaseType.resolves( { commits, releaseType: 'skip' } );

			stubs.cliUtils.provideVersion.resolves( '1.0.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					/* eslint-disable max-len */
					const expectedNewChangelog = `## [1.0.0](https://github.com/ckeditor/alpha/compare/v0.0.1...v1.0.0) (2017-10-09)

### Dependencies

Major releases (dependencies of those packages have breaking changes):

* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v1.0.0](https://github.com/ckeditor/epsilon/releases/tag/v1.0.0)

Minor releases (new features, no breaking changes):

* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.4.0](https://github.com/ckeditor/gamma/releases/tag/v0.4.0)

Patch releases (bug fixes, internal changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.2.1](https://github.com/ckeditor/beta/releases/tag/v0.2.1)
`;
					expect( stubs.transformCommitFunctionFactory.calledOnce ).to.equal( true );
					expect( stubs.transformCommitFunctionFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true
					} );

					/* eslint-enable max-len */
					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( { tagName: undefined } );

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( packagesPaths.alpha );

					expect( stubs.cliUtils.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );

					// Major bump was suggested because of packages changes.
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 1 ] ).to.equal( 'major' );
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 2 ] ).to.deep.equal( {
						disableInternalVersion: true
					} );

					expect( processChidirStub.callCount ).to.equal( 2 );
					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( packagesPaths.alpha );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );

					const genetatedChangelogMap = stubs.displayGeneratedChangelogs.firstCall.args[ 0 ];

					expect( genetatedChangelogMap.has( '@ckeditor/alpha' ) ).to.equal( true );
					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'uses specified version as proposed when asking about it', () => {
			const commits = [ {}, {} ];

			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.alpha
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.1' );

			// Minor release (no minor breaking changes).
			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.4.0' );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.4.0', packagesPaths.gamma ).returns( false );

			// Major release (no major breaking changes).
			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '1.0.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '1.0.0', packagesPaths.epsilon ).returns( false );

			stubs.getNewReleaseType.resolves( { commits, releaseType: 'skip' } );

			stubs.cliUtils.provideVersion.resolves( '1.0.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true,
				version: '1.0.0'
			};

			return generateSummaryChangelog( options )
				.then( () => {
					// '1.0.0' bump was suggested because of `options.version`.
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 1 ] ).to.equal( '1.0.0' );
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 2 ] ).to.deep.equal( {
						disableInternalVersion: true
					} );

					expect( processChidirStub.callCount ).to.equal( 2 );
				} );
		} );

		it( 'attaches notes from commits in the package', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.alpha
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.alpha ).returns( '0.0.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.3.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.5.1' );

			stubs.getNewReleaseType.resolves( { releaseType: 'minor' } );

			stubs.generateChangelogFromCommits.resolves(
				'## [0.1.0](https://github.com/ckeditor/alpha/compare/v0.0.1...v0.1.0) (2017-10-09)\n\n' +
				'Changelog entries generated from commits.\n\n'
			);

			stubs.cliUtils.provideVersion.resolves( '0.1.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					/* eslint-disable max-len */
					const expectedNewChangelog = `## [0.1.0](https://github.com/ckeditor/alpha/compare/v0.0.1...v0.1.0) (2017-10-09)

Changelog entries generated from commits.

### Dependencies

Patch releases (bug fixes, internal changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.2.1](https://github.com/ckeditor/beta/releases/tag/v0.2.1)
* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v0.5.1](https://github.com/ckeditor/epsilon/releases/tag/v0.5.1)
* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.3.1](https://github.com/ckeditor/gamma/releases/tag/v0.3.1)
`;
					/* eslint-enable max-len */

					expect( stubs.transformCommitFunctionFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFunctionFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true
					} );
					expect( stubs.transformCommitFunctionFactory.secondCall.args ).to.deep.equal( [] );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( { tagName: 'v0.0.1' } );

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( packagesPaths.alpha );

					expect( stubs.cliUtils.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					// Minor bump was suggested because of commits.
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 2 ] ).to.deep.equal( {
						disableInternalVersion: true
					} );

					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						currentTag: 'v0.1.0',
						previousTag: 'v0.0.1',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						additionalNotes: true,
						doNotSave: true
					} );

					expect( processChidirStub.callCount ).to.equal( 2 );
					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( packagesPaths.alpha );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );

					const genetatedChangelogMap = stubs.displayGeneratedChangelogs.firstCall.args[ 0 ];

					expect( genetatedChangelogMap.has( '@ckeditor/alpha' ) ).to.equal( true );
				} );
		} );

		it( 'splits major releases as "MAJOR BREAKING CHANGES" and major dependencies update', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.omega
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.omega ).returns( '1.0.0' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '1.0.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '1.0.0', packagesPaths.beta ).returns( false );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '1.0.0', packagesPaths.epsilon ).returns( false );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '1.0.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '1.0.0', packagesPaths.gamma ).returns( true );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '1.0.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '1.0.0', packagesPaths.epsilon ).returns( false );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '1.0.0', packagesPaths.epsilon ).returns( true );

			stubs.getNewReleaseType.resolves( { releaseType: 'major' } );

			stubs.generateChangelogFromCommits.resolves(
				'## [2.0.0](https://github.com/ckeditor/omega/compare/v1.0.0...v2.0.0) (2017-10-09)\n\n' +
				'Changelog entries generated from commits.\n\n'
			);

			stubs.cliUtils.provideVersion.resolves( '2.0.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					/* eslint-disable max-len */
					const expectedNewChangelog = `## [2.0.0](https://github.com/ckeditor/omega/compare/v1.0.0...v2.0.0) (2017-10-09)

Changelog entries generated from commits.

### Dependencies

Major releases (contain major breaking changes):

* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v1.0.0](https://github.com/ckeditor/gamma/releases/tag/v1.0.0)

Major releases (contain minor breaking changes):

* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v1.0.0](https://github.com/ckeditor/epsilon/releases/tag/v1.0.0)

Major releases (dependencies of those packages have breaking changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v1.0.0](https://github.com/ckeditor/beta/releases/tag/v1.0.0)
`;
					/* eslint-enable max-len */
					expect( stubs.transformCommitFunctionFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFunctionFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true
					} );
					expect( stubs.transformCommitFunctionFactory.secondCall.args ).to.deep.equal( [] );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( { tagName: 'v1.0.0' } );

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( packagesPaths.omega );

					expect( stubs.cliUtils.provideVersion.firstCall.args[ 0 ] ).to.equal( '1.0.0' );
					// Minor bump was suggested because of commits.
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 1 ] ).to.equal( 'major' );
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 2 ] ).to.deep.equal( {
						disableInternalVersion: true
					} );

					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '2.0.0',
						currentTag: 'v2.0.0',
						previousTag: 'v1.0.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						additionalNotes: true,
						doNotSave: true
					} );

					expect( processChidirStub.callCount ).to.equal( 2 );
					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( packagesPaths.omega );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );

					const genetatedChangelogMap = stubs.displayGeneratedChangelogs.firstCall.args[ 0 ];

					expect( genetatedChangelogMap.has( '@ckeditor/omega' ) ).to.equal( true );
				} );
		} );

		it( 'splits minor releases as "MINOR BREAKING CHANGES" and new features', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.omega
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.omega ).returns( '1.0.0' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.3.0' );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.3.0', packagesPaths.beta ).returns( false );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.4.0' );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.4.0', packagesPaths.gamma ).returns( false );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.6.0' );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.6.0', packagesPaths.epsilon ).returns( true );

			stubs.getNewReleaseType.resolves( { releaseType: 'minor' } );

			stubs.generateChangelogFromCommits.resolves(
				'## [1.1.0](https://github.com/ckeditor/omega/compare/v1.0.0...v1.1.0) (2017-10-09)\n\n' +
				'Changelog entries generated from commits.\n\n'
			);

			stubs.cliUtils.provideVersion.resolves( '1.1.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					/* eslint-disable max-len */
					const expectedNewChangelog = `## [1.1.0](https://github.com/ckeditor/omega/compare/v1.0.0...v1.1.0) (2017-10-09)

Changelog entries generated from commits.

### Dependencies

Minor releases (containing minor breaking changes):

* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v0.6.0](https://github.com/ckeditor/epsilon/releases/tag/v0.6.0)

Minor releases (new features, no breaking changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.3.0](https://github.com/ckeditor/beta/releases/tag/v0.3.0)
* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.4.0](https://github.com/ckeditor/gamma/releases/tag/v0.4.0)
`;
					/* eslint-enable max-len */
					expect( stubs.transformCommitFunctionFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFunctionFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true
					} );
					expect( stubs.transformCommitFunctionFactory.secondCall.args ).to.deep.equal( [] );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( { tagName: 'v1.0.0' } );

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( packagesPaths.omega );

					expect( stubs.cliUtils.provideVersion.firstCall.args[ 0 ] ).to.equal( '1.0.0' );
					// Minor bump was suggested because of commits.
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 2 ] ).to.deep.equal( {
						disableInternalVersion: true
					} );

					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '1.1.0',
						currentTag: 'v1.1.0',
						previousTag: 'v1.0.0',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						additionalNotes: true,
						doNotSave: true
					} );

					expect( processChidirStub.callCount ).to.equal( 2 );
					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( packagesPaths.omega );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );

					const genetatedChangelogMap = stubs.displayGeneratedChangelogs.firstCall.args[ 0 ];

					expect( genetatedChangelogMap.has( '@ckeditor/omega' ) ).to.equal( true );
				} );
		} );

		it( 'handles MAJOR/MINOR changes for initial release', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.alpha
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.alpha ).returns( '0.0.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.3.0' );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.3.0', packagesPaths.beta ).returns( true );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.4.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '0.4.0', packagesPaths.gamma ).returns( false );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.4.0', packagesPaths.gamma ).returns( false );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.6.0' );
			stubs.changelogUtils.hasMajorBreakingChanges.withArgs( '0.6.0', packagesPaths.epsilon ).returns( false );
			stubs.changelogUtils.hasMinorBreakingChanges.withArgs( '0.6.0', packagesPaths.epsilon ).returns( true );

			stubs.getNewReleaseType.resolves( { releaseType: 'minor' } );

			stubs.generateChangelogFromCommits.resolves(
				'## [0.1.0](https://github.com/ckeditor/alpha/compare/v0.0.1...v0.1.0) (2017-10-09)\n\n' +
				'Changelog entries generated from commits.\n\n'
			);

			stubs.cliUtils.provideVersion.resolves( '0.1.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					/* eslint-disable max-len */
					const expectedNewChangelog = `## [0.1.0](https://github.com/ckeditor/alpha/compare/v0.0.1...v0.1.0) (2017-10-09)

Changelog entries generated from commits.

### Dependencies

Minor releases (containing major/minor breaking changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.3.0](https://github.com/ckeditor/beta/releases/tag/v0.3.0)
* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v0.6.0](https://github.com/ckeditor/epsilon/releases/tag/v0.6.0)

Minor releases (new features, no breaking changes):

* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.4.0](https://github.com/ckeditor/gamma/releases/tag/v0.4.0)
`;
					/* eslint-enable max-len */
					expect( stubs.transformCommitFunctionFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFunctionFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true
					} );
					expect( stubs.transformCommitFunctionFactory.secondCall.args ).to.deep.equal( [] );

					// There is no "major" bump so the function should be never called.
					expect( stubs.changelogUtils.hasMajorBreakingChanges.called ).to.equal( false );

					expect( stubs.getNewReleaseType.calledOnce ).to.equal( true );
					expect( stubs.getNewReleaseType.firstCall.args[ 0 ] ).to.equal( stubs.transformCommit[ 0 ] );
					expect( stubs.getNewReleaseType.firstCall.args[ 1 ] ).to.deep.equal( { tagName: 'v0.0.1' } );

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( packagesPaths.alpha );

					expect( stubs.cliUtils.provideVersion.firstCall.args[ 0 ] ).to.equal( '0.0.1' );
					// Minor bump was suggested because of commits.
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 1 ] ).to.equal( 'minor' );
					expect( stubs.cliUtils.provideVersion.firstCall.args[ 2 ] ).to.deep.equal( {
						disableInternalVersion: true
					} );

					expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						currentTag: 'v0.1.0',
						previousTag: 'v0.0.1',
						transformCommit: stubs.transformCommit[ 1 ],
						isInternalRelease: false,
						additionalNotes: true,
						doNotSave: true
					} );

					expect( processChidirStub.callCount ).to.equal( 2 );
					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( packagesPaths.alpha );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayGeneratedChangelogs.calledOnce ).to.equal( true );

					const genetatedChangelogMap = stubs.displayGeneratedChangelogs.firstCall.args[ 0 ];

					expect( genetatedChangelogMap.has( '@ckeditor/alpha' ) ).to.equal( true );
				} );
		} );

		it( 'allows generating changelog for main repository', () => {
			const commits = [ {}, {} ];

			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set(),
				skipped: new Set( [
					packagesPaths.alpha,
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon,
					packagesPaths.devKappa
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.alpha ).returns( '0.0.1' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.alpha ).returns( '0.1.0' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.3.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.delta ).returns( '0.4.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.delta ).returns( '0.4.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.5.1' );

			stubs.getNewReleaseType.resolves( { commits, releaseType: 'minor' } );

			stubs.generateChangelogFromCommits.resolves(
				'## [0.2.0](https://github.com/ckeditor/foo-bar/compare/v0.1.0...v0.2.0) (2017-10-09)\n\n' +
				'Changelog entries generated from commits.\n\n'
			);

			stubs.cliUtils.provideVersion.resolves( '0.2.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			return generateSummaryChangelog( options )
				.then( () => {
					/* eslint-disable max-len */
					const expectedNewChangelog = `## [0.2.0](https://github.com/ckeditor/foo-bar/compare/v0.1.0...v0.2.0) (2017-10-09)

Changelog entries generated from commits.

### Dependencies

New packages:

* [@ckeditor/alpha](https://www.npmjs.com/package/@ckeditor/alpha): [v0.1.0](https://github.com/ckeditor/alpha/releases/tag/v0.1.0)

Patch releases (bug fixes, internal changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.2.1](https://github.com/ckeditor/beta/releases/tag/v0.2.1)
* [@ckeditor/delta](https://www.npmjs.com/package/@ckeditor/delta): v0.4.0 => [v0.4.1](https://github.com/ckeditor/delta/releases/tag/v0.4.1)
* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v0.5.1](https://github.com/ckeditor/epsilon/releases/tag/v0.5.1)
* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.3.1](https://github.com/ckeditor/gamma/releases/tag/v0.3.1)
`;
					/* eslint-enable max-len */
					expect( stubs.transformCommitFunctionFactory.calledTwice ).to.equal( true );
					expect( stubs.transformCommitFunctionFactory.firstCall.args[ 0 ] ).to.deep.equal( {
						returnInvalidCommit: true
					} );
					expect( stubs.transformCommitFunctionFactory.secondCall.args ).to.deep.equal( [] );

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( mainPackagePath );

					expect( processChidirStub.callCount ).to.equal( 2 );

					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( mainPackagePath );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayCommits.calledOnce ).to.equal( true );
					expect( stubs.displayCommits.firstCall.args[ 0 ] ).to.deep.equal( commits );
				} );
		} );

		it( 'allows restricting the packages scope', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set(),
				skipped: new Set()
			} );

			stubs.executeOnPackages.resolves();

			const skipPackages = [ 'some-pacakge' ];
			const scope = /some-regexp/;

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipPackages,
				scope
			};

			return generateSummaryChangelog( options )
				.then( () => {
					expect( stubs.getSubRepositoriesPaths.firstCall.args[ 0 ] ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						skipMainRepository: true,
						skipPackages,
						scope
					} );
				} );
		} );

		it( 'does not generate the changelog if user provides "skip" as new version', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.alpha
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.1' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.4.0' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.1.0' );

			stubs.getNewReleaseType.resolves( { releaseType: 'skip' } );

			stubs.cliUtils.provideVersion.resolves( 'skip' );

			const processChidirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					expect( stubs.changelogUtils.saveChangelog.called ).to.equal( false );
					expect( processChidirStub.callCount ).to.equal( 2 );
					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( packagesPaths.alpha );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );

					expect( stubs.displayGeneratedChangelogs.called ).to.equal( true );
					expect( stubs.displayGeneratedChangelogs.firstCall.args[ 0 ].size ).to.equal( 0 );
				} );
		} );

		it( 'does not attach the "Dependencies" header if any dependency has not been added or changed', () => {
			stubs.getSubRepositoriesPaths.returns( {
				matched: new Set( [
					packagesPaths.alpha
				] ),
				skipped: new Set( [
					packagesPaths.beta,
					packagesPaths.gamma,
					packagesPaths.delta,
					packagesPaths.epsilon
				] )
			} );

			stubs.executeOnPackages.callsFake( executeOnPackages );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.0' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.3.0' );

			stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );

			stubs.getNewReleaseType.resolves( { releaseType: 'skip' } );

			stubs.cliUtils.provideVersion.resolves( '1.0.0' );

			stubs.moment.format.returns( '2017-10-09' );

			stubs.fs.existsSync.returns( true );

			stubs.changelogUtils.getChangelog.returns( '' );

			sandbox.stub( process, 'chdir' );

			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipMainRepository: true
			};

			return generateSummaryChangelog( options )
				.then( () => {
					const expectedNewChangelog = '## [1.0.0](https://github.com/ckeditor/alpha/compare/v0.0.1...v1.0.0) (2017-10-09)\n';

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( packagesPaths.alpha );
				} );
		} );

		describe( 'additional notes for group of commits', () => {
			it( 'are visible when dependencies have been added or changed', () => {
				stubs.getSubRepositoriesPaths.returns( {
					matched: new Set(),
					skipped: new Set( [
						packagesPaths.alpha,
						packagesPaths.beta,
						packagesPaths.gamma,
						packagesPaths.delta,
						packagesPaths.epsilon
					] )
				} );

				stubs.executeOnPackages.callsFake( executeOnPackages );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.alpha ).returns( '0.0.1' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.alpha ).returns( '0.1.0' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.1' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.3.1' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.delta ).returns( '0.4.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.delta ).returns( '0.4.1' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.5.1' );

				stubs.getNewReleaseType.resolves( { releaseType: 'minor' } );

				stubs.generateChangelogFromCommits.resolves(
					'## Changelog header (will be removed)\n\n' +
					'Changelog entries generated from commits.\n\n'
				);

				stubs.cliUtils.provideVersion.resolves( '0.2.0' );

				stubs.moment.format.returns( '2017-10-09' );

				stubs.fs.existsSync.returns( true );

				stubs.changelogUtils.getChangelog.returns( '' );

				sandbox.stub( process, 'chdir' );

				const options = {
					cwd: mainPackagePath,
					packages: 'packages'
				};

				return generateSummaryChangelog( options )
					.then( () => {
						expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.have.property( 'additionalNotes', true );
					} );
			} );

			it( 'are hidden when dependencies have not been added or changed', () => {
				stubs.getSubRepositoriesPaths.returns( {
					matched: new Set(),
					skipped: new Set( [
						packagesPaths.alpha,
						packagesPaths.beta,
						packagesPaths.gamma,
						packagesPaths.delta,
						packagesPaths.epsilon
					] )
				} );

				stubs.executeOnPackages.callsFake( executeOnPackages );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.alpha ).returns( '0.0.1' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.alpha ).returns( '0.0.1' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.beta ).returns( '0.2.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.beta ).returns( '0.2.0' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.gamma ).returns( '0.3.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.gamma ).returns( '0.3.0' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.delta ).returns( '0.4.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.delta ).returns( '0.4.0' );

				stubs.versionUtils.getCurrent.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );
				stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '0.5.0' );

				stubs.getNewReleaseType.resolves( { releaseType: 'minor' } );

				stubs.generateChangelogFromCommits.resolves(
					'## Changelog header (will be removed)\n\n' +
					'Changelog entries generated from commits.\n\n'
				);

				stubs.cliUtils.provideVersion.resolves( '0.2.0' );

				stubs.moment.format.returns( '2017-10-09' );

				stubs.fs.existsSync.returns( true );

				stubs.changelogUtils.getChangelog.returns( '' );

				sandbox.stub( process, 'chdir' );

				const options = {
					cwd: mainPackagePath,
					packages: 'packages'
				};

				return generateSummaryChangelog( options )
					.then( () => {
						expect( stubs.generateChangelogFromCommits.firstCall.args[ 0 ] ).to.have.property( 'additionalNotes', false );
					} );
			} );
		} );
	} );
} );
