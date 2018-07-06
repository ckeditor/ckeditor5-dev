/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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
	epsilon: path.join( mainPackagePath, 'packages', 'epsilon' )
};

const testCwd = process.cwd();

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
				changelogHeader: ''
			},
			displayGeneratedChangelogs: sandbox.stub(),
			getSubRepositoriesPaths: sandbox.stub(),
			transformCommitFunction: sandbox.stub(),
			generateChangelogFromCommits: sandbox.stub(),
			getNewReleaseType: sandbox.stub(),
			executeOnPackages: sandbox.stub(),
			moment: {
				format: sandbox.stub()
			},
			fs: {
				existsSync: sandbox.stub()
			}
		};

		mockery.registerMock( 'moment', () => stubs.moment );
		mockery.registerMock( '../utils/displaygeneratedchangelogs', stubs.displayGeneratedChangelogs );
		mockery.registerMock( '../utils/transform-commit/transformcommitforsubrepository', stubs.transformCommitFunction );
		mockery.registerMock( '../utils/generatechangelogfromcommits', stubs.generateChangelogFromCommits );
		mockery.registerMock( '../utils/executeonpackages', stubs.executeOnPackages );
		mockery.registerMock( '../utils/getnewreleasetype', stubs.getNewReleaseType );
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
			stubs.getSubRepositoriesPaths.returns( {
				packages: new Set( [
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
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '1.0.0' );

			stubs.getNewReleaseType.resolves( { releaseType: 'skip' } );

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

Major releases (contain breaking changes):

* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v1.0.0](https://github.com/ckeditor/epsilon/releases/tag/v1.0.0)

Minor releases:

* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.4.0](https://github.com/ckeditor/gamma/releases/tag/v0.4.0)

Patch releases (bug fixes, internal changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.2.1](https://github.com/ckeditor/beta/releases/tag/v0.2.1)
`;
					/* eslint-enable max-len */

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
				} );
		} );

		it( 'attaches notes from commits in the package', () => {
			stubs.getSubRepositoriesPaths.returns( {
				packages: new Set( [
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
				'## Changelog header (will be removed)\n\n' +
				'Changelog entries generated from commits.'
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

### Dependencies

Patch releases (bug fixes, internal changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.2.1](https://github.com/ckeditor/beta/releases/tag/v0.2.1)
* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v0.5.1](https://github.com/ckeditor/epsilon/releases/tag/v0.5.1)
* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.3.1](https://github.com/ckeditor/gamma/releases/tag/v0.3.1)

Changelog entries generated from commits.
`;
					/* eslint-enable max-len */

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
						transformCommit: stubs.transformCommitFunction,
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
			stubs.getSubRepositoriesPaths.returns( {
				packages: new Set(),
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
				'Changelog entries generated from commits.'
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

### Dependencies

New packages:

* [@ckeditor/alpha](https://www.npmjs.com/package/@ckeditor/alpha): [v0.1.0](https://github.com/ckeditor/alpha/releases/tag/v0.1.0)

Patch releases (bug fixes, internal changes):

* [@ckeditor/beta](https://www.npmjs.com/package/@ckeditor/beta): v0.2.0 => [v0.2.1](https://github.com/ckeditor/beta/releases/tag/v0.2.1)
* [@ckeditor/delta](https://www.npmjs.com/package/@ckeditor/delta): v0.4.0 => [v0.4.1](https://github.com/ckeditor/delta/releases/tag/v0.4.1)
* [@ckeditor/epsilon](https://www.npmjs.com/package/@ckeditor/epsilon): v0.5.0 => [v0.5.1](https://github.com/ckeditor/epsilon/releases/tag/v0.5.1)
* [@ckeditor/gamma](https://www.npmjs.com/package/@ckeditor/gamma): v0.3.0 => [v0.3.1](https://github.com/ckeditor/gamma/releases/tag/v0.3.1)

Changelog entries generated from commits.
`;

					/* eslint-enable max-len */

					expect( stubs.changelogUtils.saveChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 0 ] ).to.equal( expectedNewChangelog );
					expect( stubs.changelogUtils.saveChangelog.firstCall.args[ 1 ] ).to.equal( mainPackagePath );

					expect( processChidirStub.callCount ).to.equal( 2 );

					expect( processChidirStub.firstCall.args[ 0 ] ).to.equal( mainPackagePath );
					expect( processChidirStub.secondCall.args[ 0 ] ).to.equal( testCwd );
				} );
		} );

		it( 'allows restricting the packages scope', () => {
			stubs.getSubRepositoriesPaths.returns( {
				packages: new Set(),
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
						skipPackages,
						scope
					} );
				} );
		} );

		it( 'does not generate the changelog if user provides "skip" as new version', () => {
			stubs.getSubRepositoriesPaths.returns( {
				packages: new Set( [
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
			stubs.versionUtils.getLastFromChangelog.withArgs( packagesPaths.epsilon ).returns( '1.0.0' );

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
				packages: new Set( [
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
			it( 'are visible when dependencies has been added or changed', () => {
				stubs.getSubRepositoriesPaths.returns( {
					packages: new Set(),
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
					'Changelog entries generated from commits.'
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

			it( 'are hidden when dependencies has not been added or changed', () => {
				stubs.getSubRepositoriesPaths.returns( {
					packages: new Set(),
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
					'Changelog entries generated from commits.'
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
