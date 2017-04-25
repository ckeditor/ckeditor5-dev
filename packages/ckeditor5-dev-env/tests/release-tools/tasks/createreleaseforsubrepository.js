/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	describe( 'createReleaseForSubRepository()', () => {
		let createReleaseForSubRepository, sandbox, stubs, options, updateJsonFileArgs;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				createGithubRelease: sandbox.stub(),
				generateChangelogForSinglePackage: sandbox.stub(),
				updateDependenciesVersions: sandbox.stub(),
				parseGithubUrl: sandbox.stub(),
				getPackageJson: sandbox.stub(),
				logger: {
					info: sandbox.spy(),
					warning: sandbox.spy(),
					error: sandbox.spy()
				},
				tools: {
					shExec: sandbox.stub(),
					updateJSONFile: sandbox.spy( ( packageJsonPath, jsonFunction ) => {
						updateJsonFileArgs = [ packageJsonPath, jsonFunction ];
					} )
				},
				changelogUtils: {
					getChangesForVersion: sandbox.stub()
				},
				versionUtils: {
					getLastFromChangelog: sandbox.stub()
				}
			};

			mockery.registerMock( '../utils/getpackagejson', stubs.getPackageJson );
			mockery.registerMock( '../utils/changelog', stubs.changelogUtils );
			mockery.registerMock( '../utils/versions', stubs.versionUtils );
			mockery.registerMock( '../utils/updatedependenciesversions', stubs.updateDependenciesVersions );
			mockery.registerMock( './creategithubrelease', stubs.createGithubRelease );
			mockery.registerMock( './generatechangelogforsinglepackage', stubs.generateChangelogForSinglePackage );
			mockery.registerMock( 'parse-github-url', stubs.parseGithubUrl );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );
			sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

			createReleaseForSubRepository = proxyquire( '../../../lib/release-tools/tasks/createreleaseforsubrepository', {
				'@ckeditor/ckeditor5-dev-utils': {
					tools: stubs.tools,

					logger() {
						return stubs.logger;
					}
				}
			} );

			options = {
				token: 'github-secret-token',
				skipNpm: true,
				skipGithub: true,
				dependencies: new Map()
			};
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'generates changelog if was not generated before', () => {
			options.dependencies.set( '@ckeditor/ckeditor5-core', { version: '1.0.0', hasChangelog: false } );

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.generateChangelogForSinglePackage.returns( Promise.resolve() );
			stubs.tools.shExec.withArgs( 'git diff --name-only package.json' ).returns( '' );

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( stubs.generateChangelogForSinglePackage.calledOnce ).to.equal( true );
					expect( stubs.generateChangelogForSinglePackage.firstCall.args[ 0 ] ).to.equal( '1.0.0' );

					expect( options.dependencies.get( '@ckeditor/ckeditor5-core' ).hasChangelog ).to.equal( true );
				} );
		} );

		it( 'does not generate changelog if was generated before', () => {
			options.dependencies.set( '@ckeditor/ckeditor5-core', { version: '1.0.0', hasChangelog: true } );

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.tools.shExec.withArgs( 'git diff --name-only package.json' ).returns( '' );

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( stubs.generateChangelogForSinglePackage.calledOnce ).to.equal( false );
				} );
		} );

		it( 'updates dependencies before release', () => {
			options.dependencies.set( '@ckeditor/ckeditor5-core', { version: '1.0.0', hasChangelog: true } );
			options.dependencies.set( '@ckeditor/ckeditor5-engine', { version: '0.2.0', hasChangelog: true } );

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.tools.shExec.withArgs( 'git diff --name-only package.json' ).returns( 'package.json' );

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( stubs.updateDependenciesVersions.calledOnce ).to.equal( true );
					expect( stubs.updateDependenciesVersions.firstCall.args[ 0 ] ).to.deep.equal( options.dependencies );
					expect( stubs.updateDependenciesVersions.firstCall.args[ 1 ] ).to.deep.equal( '/cwd/package.json' );

					expect( stubs.logger.info.called ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( '' );
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.match( /Creating release for "@ckeditor\/ckeditor5-core"\./ );
					expect( stubs.logger.info.thirdCall.args[ 0 ] ).to.equal( 'Updating dependencies...' );

					expect( stubs.tools.shExec.calledWith( 'git add package.json' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git commit -m "Internal: Updated dependencies."' ) ).to.equal( true );
				} );
		} );

		it( 'does not throw an error if dependencies are not defined', () => {
			delete options.dependencies;

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( stubs.updateDependenciesVersions.called ).to.equal( false );
				} );
		} );

		it( 'release the package', () => {
			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.tools.shExec.returns( '' );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelogUtils.getChangesForVersion.returns( 'Changes.' );

			let packageJson = {
				version: '0.0.1'
			};

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( updateJsonFileArgs[ 0 ] ).to.equal( '/cwd/package.json' );
					expect( updateJsonFileArgs[ 1 ] ).to.be.a( 'function' );
					packageJson = updateJsonFileArgs[ 1 ]( packageJson );
					expect( packageJson.version ).to.equal( '1.0.0' );

					expect( stubs.versionUtils.getLastFromChangelog.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.getChangesForVersion.calledOnce ).to.equal( true );
					expect( stubs.changelogUtils.getChangesForVersion.firstCall.args[ 0 ] ).to.equal( '1.0.0' );

					expect( stubs.parseGithubUrl.calledOnce ).to.equal( false );
					expect( stubs.createGithubRelease.calledOnce ).to.equal( false );
					expect( stubs.tools.shExec.calledWith( 'npm publish --access=public' ) ).to.equal( false );

					expect( stubs.tools.shExec.calledWith( 'git add package.json' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git commit --message="Release: v1.0.0."' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git tag v1.0.0' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git push origin master v1.0.0' ) ).to.equal( true );
					expect( stubs.logger.info.calledWithMatch( /Release "v1.0.0" has been created and published./ ) ).to.equal( true );
				} );
		} );

		it( 'publish package on npm', () => {
			options.skipNpm = false;

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.tools.shExec.returns( '' );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelogUtils.getChangesForVersion.returns( 'Changes.' );
			stubs.parseGithubUrl.returns( {
				owner: 'organization',
				name: 'repository'
			} );

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( stubs.parseGithubUrl.calledOnce ).to.equal( false );
					expect( stubs.createGithubRelease.calledOnce ).to.equal( false );
					expect( stubs.tools.shExec.calledWith( 'npm publish --access=public' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git commit --message="Release: v1.0.0."' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git tag v1.0.0' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git push origin master v1.0.0' ) ).to.equal( true );
					expect( stubs.logger.info.calledWithMatch( /Release "v1.0.0" has been created and published./ ) ).to.equal( true );
				} );
		} );

		it( 'publish package on GitHub', () => {
			options.skipGithub = false;

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.createGithubRelease.returns( Promise.resolve() );

			stubs.tools.shExec.returns( '' );
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );
			stubs.changelogUtils.getChangesForVersion.returns( 'Changes.' );
			stubs.parseGithubUrl.returns( {
				owner: 'organization',
				name: 'repository'
			} );

			return createReleaseForSubRepository( options )
				.then( () => {
					expect( stubs.parseGithubUrl.calledOnce ).to.equal( true );
					expect( stubs.createGithubRelease.calledOnce ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'npm publish --access=public' ) ).to.equal( false );

					expect( stubs.logger.info.calledWithMatch( /Release "v1.0.0" has been created and published./ ) ).to.equal( true );

					expect( stubs.createGithubRelease.firstCall.args[ 0 ] ).to.equal( options.token );
					expect( stubs.createGithubRelease.firstCall.args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'organization',
						repositoryName: 'repository',
						version: 'v1.0.0',
						description: 'Changes.'
					} );
				} );
		} );
	} );
} );
