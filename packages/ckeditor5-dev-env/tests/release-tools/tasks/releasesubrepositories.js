/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const cwd = process.cwd();
const originalFilesContent = {};

const mainPackagePath = path.join( __dirname, 'stubs', 'releasesubrepositories' );
const packagesPaths = {
	alpha: path.join( mainPackagePath, 'packages', 'alpha' ),
	beta: path.join( mainPackagePath, 'packages', 'beta' ),
	gamma: path.join( mainPackagePath, 'packages', 'gamma' ),
	delta: path.join( mainPackagePath, 'packages', 'delta' ),
	epsilon: path.join( mainPackagePath, 'packages', 'epsilon' )
};

const filesToRecoverAfterTest = [
	path.join( packagesPaths.alpha, 'package.json' ),
	path.join( packagesPaths.beta, 'package.json' ),
	path.join( packagesPaths.gamma, 'package.json' ),
	path.join( packagesPaths.delta, 'package.json' ),
	path.join( packagesPaths.epsilon, 'package.json' ),
];

describe( 'dev-env/release-tools/tasks', function() {
	this.timeout( 15 * 1000 ); // 15 sec * 1000 ms

	let releaseSubRepositories, sandbox, stubs, executedCommand;

	beforeEach( () => {
		executedCommand = [];

		for ( const filePath of filesToRecoverAfterTest ) {
			originalFilesContent[ filePath ] = fs.readFileSync( filePath, 'utf-8' );
		}

		for ( const packageName of Object.keys( packagesPaths ) ) {
			process.chdir( packagesPaths[ packageName ] );

			// In order to be sure that we are testing the clean repository.
			exec( `rm -rf ${ path.join( packagesPaths[ packageName ], '.git' ) }` );
			exec( 'git init --quiet' );
			exec( `git remote add origin https://github.com/ckeditor/ckeditor5-test-${ packageName }.git` );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

			exec( 'git add package.json && git commit -m "Initial commit."' );
		}

		process.chdir( cwd );

		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			cli: {
				confirmRelease: sandbox.stub(),
				configureReleaseOptions: sandbox.stub(),
			},
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			versions: {
				getLastFromChangelog: sandbox.stub().returns( '1.0.0' )
			},
			chalk: {
				underline: sandbox.stub().callsFake( text => text ),
				italic: sandbox.stub().callsFake( text => text ),
				blue: sandbox.stub().callsFake( text => text ),
				cyan: sandbox.stub().callsFake( text => text ),
				green: sandbox.stub().callsFake( text => text ),
				yellow: sandbox.stub().callsFake( text => text ),
				grey: sandbox.stub().callsFake( text => text ),
				bold: sandbox.stub().callsFake( text => text )
			},
			displaySkippedPackages: sandbox.stub(),
			validatePackageToRelease: sandbox.stub(),
			createGithubRelease: sandbox.stub()
		};

		mockery.registerMock( '../utils/versions', stubs.versions );
		mockery.registerMock( '../utils/displayskippedpackages', stubs.displaySkippedPackages );
		mockery.registerMock( '../utils/cli', stubs.cli );
		mockery.registerMock( '../utils/validatepackagetorelease', stubs.validatePackageToRelease );
		mockery.registerMock( '../utils/creategithubrelease', stubs.createGithubRelease );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );

		releaseSubRepositories = proxyquire( '../../../lib/release-tools/tasks/releasesubrepositories', {
			'@ckeditor/ckeditor5-dev-utils': {
				tools: {
					shExec( command, options ) {
						executedCommand.push( command );

						// Does nothing with the remote commands.
						if ( command === 'git pull' || command === 'git push' || command.startsWith( 'npm publish' ) ) {
							return '';
						}

						const response = tools.shExec( command, options );

						// Replace "branch" response with the "branch and remote branch".
						if ( response.trim() === '## master' ) {
							return '## master...origin/master';
						}

						return response;
					}
				},
				logger() {
					return stubs.logger;
				}
			},
			'chalk': stubs.chalk
		} );
	} );

	afterEach( () => {
		for ( const packageName of Object.keys( packagesPaths ) ) {
			removeChangelog( packageName );

			exec( `rm -rf ${ path.join( packagesPaths[ packageName ], '.git' ) }` );
			exec( `rm -rf ${ path.join( packagesPaths[ packageName ], 'ckeditor*.tgz' ) }` );
		}

		for ( const filePath of Object.keys( originalFilesContent ) ) {
			fs.writeFileSync( filePath, originalFilesContent[ filePath ] );
		}

		sandbox.restore();
		mockery.disable();
	} );

	describe( 'releaseSubRepositories()', () => {
		it( 'does not release anything because no packages contain the commit', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.logger.info.calledOnce ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( 'Collecting packages that will be released...' );

					expect( stubs.logger.error.calledOnce ).to.equal( true );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal(
						'None of the packages contains any changes since its last release. Aborting.'
					);
				} );
		} );

		it( 'does not release anything because user does not confirm the release', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			stubs.cli.confirmRelease.returns( Promise.resolve( false ) );

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.logger.info.calledTwice ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( 'Collecting packages that will be released...' );
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.equal(
						'Releasing has been aborted.'
					);
				} );
		} );

		it( 'displays skipped packages', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipPackages: Object.keys( packagesPaths ).map( packageName => `@ckeditor/${ packageName }` )
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );

			stubs.validatePackageToRelease.returns( [] );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.displaySkippedPackages.calledOnce ).to.equal( true );

					const skippedPackages = stubs.displaySkippedPackages.firstCall.args[ 0 ];

					expect( skippedPackages.has( packagesPaths.alpha ) ).to.equal( true );
					expect( skippedPackages.has( packagesPaths.beta ) ).to.equal( true );
					expect( skippedPackages.has( packagesPaths.gamma ) ).to.equal( true );
					expect( skippedPackages.has( packagesPaths.delta ) ).to.equal( true );
					expect( skippedPackages.has( packagesPaths.epsilon ) ).to.equal( true );
				} );
		} );

		it( 'updates version of dependencies, devDependencies and peerDependencies (even if they will not be released)', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipPackages: [
					'@ckeditor/alpha'
				]
			};

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			makeCommit( 'delta', 'Feature: Introduced another package. Yay!' );
			makeChangelog( 'delta', [
				'Changelog',
				'=========',
				'',
				'## [0.5.0](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Features',
				'',
				'* Introduced another package. Yay!',
				''
			].join( '\n' ) );
			makeCommit( 'delta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.validatePackageToRelease.returns( [] );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipNpm: true,
				skipGithub: true
			} ) );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.validatePackageToRelease.callCount ).to.equal( 1 );
					const packageJson = getRealPackageJson( 'delta' );

					expect( packageJson.dependencies[ '@ckeditor/alpha' ] ).to.equal( '^0.0.1' );
					expect( packageJson.dependencies[ '@ckeditor/gamma' ] ).to.equal( '^0.3.0' );
					expect( packageJson.devDependencies[ '@ckeditor/beta' ] ).to.equal( '^0.2.0' );
					expect( packageJson.peerDependencies[ 'ckeditor5-dev' ] ).to.equal( '1.0.0' );
				} );
		} );

		it( 'releases packages (npm and github)', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );
			makeCommit( 'alpha', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			makeCommit( 'beta', 'Fix: Some fix.' );
			makeChangelog( 'beta', [
				'Changelog',
				'=========',
				'',
				'## [0.2.1](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Fix',
				'',
				'* Some fix.',
				''
			].join( '\n' ) );
			makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			const token = 'fooToken';

			stubs.cli.configureReleaseOptions.resolves( {
				token,
				skipNpm: false,
				skipGithub: false
			} );

			stubs.validatePackageToRelease.returns( [] );
			stubs.createGithubRelease.resolves();

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( 'Collecting packages that will be released...' );

					expect( executedCommand.length ).to.equal( 14 );
					expect( stubs.createGithubRelease.callCount ).to.equal( 2 );
					expect( stubs.logger.info.callCount ).to.equal( 14 );

					expect( stubs.logger.info.getCall( 10 ).args[ 0 ] ).to.equal(
						'Created the release: https://github.com/ckeditor/ckeditor5-test-alpha/releases/tag/v0.1.0'
					);
					expect( stubs.logger.info.getCall( 12 ).args[ 0 ] ).to.equal(
						'Created the release: https://github.com/ckeditor/ckeditor5-test-beta/releases/tag/v0.2.1'
					);
					expect( stubs.logger.info.getCall( 13 ).args[ 0 ] ).to.equal(
						'Finished releasing 2 packages.'
					);

					// Alpha
					expect( executedCommand[ 0 ], 'Alpha diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 1 ], 'Alpha add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 2 ], 'Alpha commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 6 ], 'Alpha version' ).to.equal( 'npm version 0.1.0 --message "Release: v0.1.0. [skip ci]"' );
					expect( executedCommand[ 8 ], 'Alpha publish' ).to.equal( 'npm publish --access=public' );
					expect( executedCommand[ 10 ], 'Alpha push' ).to.equal( 'git push' );
					expect( executedCommand[ 12 ], 'Alpha remote' ).to.equal( 'git remote get-url origin --push' );
					expect( stubs.createGithubRelease.getCall( 0 ).args[ 0 ] ).to.equal( token );
					expect( stubs.createGithubRelease.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'ckeditor',
						repositoryName: 'ckeditor5-test-alpha',
						version: 'v0.1.0',
						description: '### Features\n\n* This is an initial commit.'
					} );

					// Beta
					expect( executedCommand[ 3 ], 'Beta diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 4 ], 'Beta add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 5 ], 'Beta commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 7 ], 'Beta version' ).to.equal( 'npm version 0.2.1 --message "Release: v0.2.1. [skip ci]"' );
					expect( executedCommand[ 9 ], 'Beta publish' ).to.equal( 'npm publish --access=public' );
					expect( executedCommand[ 11 ], 'Beta push' ).to.equal( 'git push' );
					expect( executedCommand[ 13 ], 'Beta remote' ).to.equal( 'git remote get-url origin --push' );
					expect( stubs.createGithubRelease.getCall( 1 ).args[ 0 ] ).to.equal( token );
					expect( stubs.createGithubRelease.getCall( 1 ).args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'ckeditor',
						repositoryName: 'ckeditor5-test-beta',
						version: 'v0.2.1',
						description: '### Fix\n\n* Some fix.'
					} );
				} );
		} );

		it( 'releases packages (github only)', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );
			makeCommit( 'alpha', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			makeCommit( 'beta', 'Fix: Some fix.' );
			makeChangelog( 'beta', [
				'Changelog',
				'=========',
				'',
				'## [0.2.1](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Fix',
				'',
				'* Some fix.',
				''
			].join( '\n' ) );
			makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			const token = 'fooToken';

			stubs.cli.configureReleaseOptions.resolves( {
				token,
				skipNpm: true,
				skipGithub: false
			} );

			stubs.validatePackageToRelease.returns( [] );
			stubs.createGithubRelease.resolves();

			return releaseSubRepositories( options )
				.then( () => {
					expect( executedCommand.length ).to.equal( 12 );
					expect( stubs.createGithubRelease.callCount ).to.equal( 2 );

					// Alpha
					expect( executedCommand[ 0 ], 'Alpha diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 1 ], 'Alpha add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 2 ], 'Alpha commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 6 ], 'Alpha version' ).to.equal( 'npm version 0.1.0 --message "Release: v0.1.0. [skip ci]"' );
					expect( executedCommand[ 8 ], 'Alpha push' ).to.equal( 'git push' );
					expect( executedCommand[ 10 ], 'Alpha remote' ).to.equal( 'git remote get-url origin --push' );
					expect( stubs.createGithubRelease.getCall( 0 ).args[ 0 ] ).to.equal( token );
					expect( stubs.createGithubRelease.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'ckeditor',
						repositoryName: 'ckeditor5-test-alpha',
						version: 'v0.1.0',
						description: '### Features\n\n* This is an initial commit.'
					} );

					// Beta
					expect( executedCommand[ 3 ], 'Beta diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 4 ], 'Beta add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 5 ], 'Beta commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 7 ], 'Beta version' ).to.equal( 'npm version 0.2.1 --message "Release: v0.2.1. [skip ci]"' );
					expect( executedCommand[ 9 ], 'Beta push' ).to.equal( 'git push' );
					expect( executedCommand[ 11 ], 'Beta remote' ).to.equal( 'git remote get-url origin --push' );
					expect( stubs.createGithubRelease.getCall( 1 ).args[ 0 ] ).to.equal( token );
					expect( stubs.createGithubRelease.getCall( 1 ).args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'ckeditor',
						repositoryName: 'ckeditor5-test-beta',
						version: 'v0.2.1',
						description: '### Fix\n\n* Some fix.'
					} );
				} );
		} );

		it( 'releases packages (npm only)', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );
			makeCommit( 'alpha', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			makeCommit( 'beta', 'Fix: Some fix.' );
			makeChangelog( 'beta', [
				'Changelog',
				'=========',
				'',
				'## [0.2.1](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Fix',
				'',
				'* Some fix.',
				''
			].join( '\n' ) );
			makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			stubs.cli.configureReleaseOptions.resolves( {
				skipNpm: false,
				skipGithub: true
			} );

			stubs.validatePackageToRelease.returns( [] );
			stubs.createGithubRelease.resolves();

			return releaseSubRepositories( options )
				.then( () => {
					expect( executedCommand.length ).to.equal( 12 );
					expect( stubs.createGithubRelease.called ).to.equal( false );

					// Alpha
					expect( executedCommand[ 0 ], 'Alpha diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 1 ], 'Alpha add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 2 ], 'Alpha commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 6 ], 'Alpha version' ).to.equal( 'npm version 0.1.0 --message "Release: v0.1.0. [skip ci]"' );
					expect( executedCommand[ 8 ], 'Alpha publish' ).to.equal( 'npm publish --access=public' );
					expect( executedCommand[ 10 ], 'Alpha push' ).to.equal( 'git push' );

					// Beta
					expect( executedCommand[ 3 ], 'Beta diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 4 ], 'Beta add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 5 ], 'Beta commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 7 ], 'Beta version' ).to.equal( 'npm version 0.2.1 --message "Release: v0.2.1. [skip ci]"' );
					expect( executedCommand[ 9 ], 'Beta publish' ).to.equal( 'npm publish --access=public' );
					expect( executedCommand[ 11 ], 'Beta push' ).to.equal( 'git push' );
				} );
		} );

		it( 'must not release any package if any error occurred', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );
			makeCommit( 'alpha', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			makeCommit( 'beta', 'Fix: Some fix.' );
			makeChangelog( 'beta', [
				'Changelog',
				'=========',
				'',
				'## [0.2.1](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Fix',
				'',
				'* Some fix.',
				''
			].join( '\n' ) );
			makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			stubs.validatePackageToRelease.returns( [] );
			stubs.validatePackageToRelease.onFirstCall().returns( [
				'Not on master.'
			] );
			stubs.validatePackageToRelease.onSecondCall().returns( [
				'Cannot find changelog entry for version 0.2.1.'
			] );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.validatePackageToRelease.callCount ).to.equal( 2 );

					expect( stubs.logger.error.callCount ).to.equal( 5 );
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Releasing has been aborted due to errors.' );
					expect( stubs.logger.error.getCall( 1 ).args[ 0 ] ).to.equal( '## @ckeditor/alpha' );
					expect( stubs.logger.error.getCall( 2 ).args[ 0 ] ).to.equal( '* Not on master.' );
					expect( stubs.logger.error.getCall( 3 ).args[ 0 ] ).to.equal( '## @ckeditor/beta' );
					expect( stubs.logger.error.getCall( 4 ).args[ 0 ] ).to.equal( '* Cannot find changelog entry for version 0.2.1.' );
				} );
		} );

		it( 'error during publishing on github does not break the process', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );
			makeCommit( 'alpha', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			makeCommit( 'beta', 'Fix: Some fix.' );
			makeChangelog( 'beta', [
				'Changelog',
				'=========',
				'',
				'## [0.2.1](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Fix',
				'',
				'* Some fix.',
				''
			].join( '\n' ) );
			makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			const token = 'fooToken';
			const rejectError = new Error( 'Some error.' );

			stubs.cli.configureReleaseOptions.resolves( {
				token,
				skipNpm: true,
				skipGithub: false
			} );

			stubs.validatePackageToRelease.returns( [] );
			stubs.createGithubRelease.onFirstCall().rejects( rejectError );
			stubs.createGithubRelease.onSecondCall().resolves();

			return releaseSubRepositories( options )
				.then( () => {
					expect( executedCommand.length ).to.equal( 12 );
					expect( stubs.createGithubRelease.callCount ).to.equal( 2 );

					expect( stubs.logger.error.callCount ).to.equal( 1 );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( rejectError );

					expect( stubs.logger.info.callCount ).to.equal( 12 );

					expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal(
						'Collecting packages that will be released...'
					);
					expect( stubs.logger.info.getCall( 1 ).args[ 0 ] )
						.to.equal( 'Updating dependencies for "@ckeditor/alpha"...' );
					expect( stubs.logger.info.getCall( 2 ).args[ 0 ] )
						.to.equal( 'Updating dependencies for "@ckeditor/beta"...' );
					expect( stubs.logger.info.getCall( 3 ).args[ 0 ] )
						.to.equal( 'Bumping version for "@ckeditor/alpha"...' );
					expect( stubs.logger.info.getCall( 4 ).args[ 0 ] )
						.to.equal( 'Bumping version for "@ckeditor/beta"...' );
					expect( stubs.logger.info.getCall( 5 ).args[ 0 ] )
						.to.equal( 'Pushing a local repository into the remote for "@ckeditor/alpha"...' );
					expect( stubs.logger.info.getCall( 6 ).args[ 0 ] )
						.to.equal( 'Pushing a local repository into the remote for "@ckeditor/beta"...' );
					expect( stubs.logger.info.getCall( 7 ).args[ 0 ] )
						.to.equal( 'Creating a GitHub release for "@ckeditor/alpha"...' );
					expect( stubs.logger.info.getCall( 8 ).args[ 0 ] )
						.to.equal( 'Cannot create a release on GitHub. Skipping that package.' );
					expect( stubs.logger.info.getCall( 9 ).args[ 0 ] )
						.to.equal( 'Creating a GitHub release for "@ckeditor/beta"...' );
					expect( stubs.logger.info.getCall( 10 ).args[ 0 ] )
						.to.equal( 'Created the release: https://github.com/ckeditor/ckeditor5-test-beta/releases/tag/v0.2.1' );
					expect( stubs.logger.info.getCall( 11 ).args[ 0 ] ).to.equal(
						'Finished releasing 2 packages.'
					);
				} );
		} );

		it( 'allows "dry run" which must not publish or push anything', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				dryRun: true
			};

			makeCommit( 'alpha', 'Feature: This is an initial commit.' );
			makeChangelog( 'alpha', [
				'Changelog',
				'=========',
				'',
				'## 0.1.0 (2017-06-08)',
				'',
				'### Features',
				'',
				'* This is an initial commit.',
				''
			].join( '\n' ) );
			makeCommit( 'alpha', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			makeCommit( 'beta', 'Fix: Some fix.' );
			makeChangelog( 'beta', [
				'Changelog',
				'=========',
				'',
				'## [0.2.1](https://github.com/ckeditor) (2017-06-08)',
				'',
				'### Fix',
				'',
				'* Some fix.',
				''
			].join( '\n' ) );
			makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			const token = 'fooToken';

			stubs.cli.configureReleaseOptions.resolves( {
				token,
				skipNpm: false,
				skipGithub: false
			} );

			stubs.validatePackageToRelease.returns( [] );
			stubs.createGithubRelease.resolves();

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.logger.info.secondCall.args[ 0 ] ).to.equal( 'Collecting packages that will be released...' );

					expect( executedCommand.length ).to.equal( 14 );
					expect( stubs.createGithubRelease.callCount ).to.equal( 0 );

					// Executing shell command should print the command on the screen.
					expect( stubs.logger.info.callCount ).to.equal( 29 );

					expect( stubs.logger.info.getCall( 24 ).args[ 0 ] ).to.equal(
						'Created release will be available under: https://github.com/ckeditor/ckeditor5-test-alpha/releases/tag/v0.1.0'
					);
					expect( stubs.logger.info.getCall( 27 ).args[ 0 ] ).to.equal(
						'Created release will be available under: https://github.com/ckeditor/ckeditor5-test-beta/releases/tag/v0.2.1'
					);
					expect( stubs.logger.info.getCall( 28 ).args[ 0 ] ).to.equal(
						'Finished releasing 2 packages.'
					);

					// Alpha
					expect( executedCommand[ 0 ], 'Alpha diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 1 ], 'Alpha add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 2 ], 'Alpha commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 6 ], 'Alpha version' ).to.equal(
						'npm version 0.1.0 --no-git-tag-version && git add package.json && ' +
						'git commit --message "Release: v0.1.0. [skip ci]"'
					);
					expect( executedCommand[ 8 ], 'Alpha publish' ).to.equal( 'npm pack' );
					expect( executedCommand[ 10 ], 'Alpha push' ).to.equal( 'echo "Pushing the repository to the remote..."' );
					expect( executedCommand[ 12 ], 'Alpha remote' ).to.equal( 'git remote get-url origin --push' );
					expect( stubs.validatePackageToRelease.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
						version: '0.1.0',
						changes: '### Features\n\n* This is an initial commit.'
					} );

					// Beta
					expect( executedCommand[ 3 ], 'Beta diff' ).to.equal( 'git diff --name-only package.json' );
					expect( executedCommand[ 4 ], 'Beta add to commit' ).to.equal( 'git add package.json' );
					expect( executedCommand[ 5 ], 'Beta commit' ).to.equal( 'git commit -m "Internal: Updated dependencies. [skip ci]"' );
					expect( executedCommand[ 7 ], 'Beta version' ).to.equal(
						'npm version 0.2.1 --no-git-tag-version && git add package.json && ' +
						'git commit --message "Release: v0.2.1. [skip ci]"'
					);
					expect( executedCommand[ 9 ], 'Beta publish' ).to.equal( 'npm pack' );
					expect( executedCommand[ 11 ], 'Beta push' ).to.equal( 'echo "Pushing the repository to the remote..."' );
					expect( executedCommand[ 13 ], 'Beta remote' ).to.equal( 'git remote get-url origin --push' );
					expect( stubs.validatePackageToRelease.getCall( 1 ).args[ 0 ] ).to.deep.equal( {
						version: '0.2.1',
						changes: '### Fix\n\n* Some fix.'
					} );
				} );
		} );
	} );
} );

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}

function makeCommit( packageName, commitMessage, files = [] ) {
	process.chdir( packagesPaths[ packageName ] );

	if ( files.length ) {
		exec( `git add ${ files.join( ' ' ) }` );
	}

	exec( `git commit --allow-empty -m "${ commitMessage }"` );

	process.chdir( cwd );
}

function makeChangelog( packageName, changelog ) {
	fs.writeFileSync( path.join( packagesPaths[ packageName ], 'CHANGELOG.md' ), changelog );
}

function removeChangelog( packageName ) {
	const changelogFile = path.join( packagesPaths[ packageName ], 'CHANGELOG.md' );

	if ( fs.existsSync( changelogFile ) ) {
		exec( `rm ${ path.join( packagesPaths[ packageName ], 'CHANGELOG.md' ) }` );
	}
}

function getRealPackageJson( packageName ) {
	return JSON.parse(
		fs.readFileSync( path.join( packagesPaths[ packageName ], 'package.json' ), 'utf-8' )
	);
}
