/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
	this.timeout( 10 * 1000 ); 	// 10 sec * 1000 ms

	let releaseSubRepositories, sandbox, stubs;

	beforeEach( () => {
		for ( const filePath of filesToRecoverAfterTest ) {
			originalFilesContent[ filePath ] = fs.readFileSync( filePath, 'utf-8' );
		}

		for ( const packageName of Object.keys( packagesPaths ) ) {
			process.chdir( packagesPaths[ packageName ] );
			// In order to be sure that we are testing the clean repository.
			exec( `rm -rf ${ path.join( packagesPaths[ packageName ], '.git' ) }` );
			exec( 'git init --quiet' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

			exec( 'git add package.json && git commit -m "Initial commit."' );
		}

		process.chdir( cwd );

		sandbox = sinon.sandbox.create();

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
			displaySkippedPackages: sandbox.stub(),
			releaseRepository: sandbox.stub(),
			generateChangelogForSinglePackage: sandbox.stub(),
			validatePackageToRelease: sandbox.stub()
		};

		mockery.registerMock( '../utils/releaserepository', stubs.releaseRepository );
		mockery.registerMock( './generatechangelogforsinglepackage', stubs.generateChangelogForSinglePackage );
		mockery.registerMock( '../utils/displayskippedpackages', stubs.displaySkippedPackages );
		mockery.registerMock( '../utils/cli', stubs.cli );
		mockery.registerMock( '../utils/validatepackagetorelease', stubs.validatePackageToRelease );

		sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );

		releaseSubRepositories = proxyquire( '../../../lib/release-tools/tasks/releasesubrepositories', {
			'@ckeditor/ckeditor5-dev-utils': {
				tools: {
					shExec( command, options ) {
						if ( command === 'git pull && git push' ) {
							return '';
						}

						const response = tools.shExec( command, options );

						if ( response.trim() === '## master' ) {
							return '## master...origin/master';
						}

						return response;
					}
				},
				logger() {
					return stubs.logger;
				}
			}
		} );
	} );

	afterEach( () => {
		for ( const packageName of Object.keys( packagesPaths ) ) {
			removeChangelog( packageName );
			exec( `rm -rf ${ path.join( packagesPaths[ packageName ], '.git' ) }` );
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

			stubs.cli.confirmRelease.returns( Promise.reject() );

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
					expect( stubs.logger.info.calledOnce ).to.equal( true );
					expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal(
						'Aborted due to user\'s no confirmation.'
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

		it( 'updates version of dependencies (even if they will not be released)', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages',
				skipPackages: [
					'@ckeditor/alpha'
				]
			};

			stubs.cli.confirmRelease.returns( Promise.resolve() );

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

			stubs.releaseRepository.returns( Promise.resolve() );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.validatePackageToRelease.callCount ).to.equal( 1 );
					const packageJson = getRealPackageJson( 'delta' );

					expect( packageJson.dependencies[ '@ckeditor/alpha' ] ).to.equal( '^0.0.1' );
					expect( packageJson.dependencies[ '@ckeditor/gamma' ] ).to.equal( '^0.3.0' );
				} );
		} );

		it( 'generates changelog if dependencies of package have been changed', () => {
			const options = {
				cwd: mainPackagePath,
				packages: 'packages'
			};

			stubs.cli.confirmRelease.returns( Promise.resolve() );

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

			stubs.generateChangelogForSinglePackage.onFirstCall()
				.returns( new Promise( resolve => {
					// Without this timeout, the promise is resolving before starting the test and `getPackagesToRelease()`
					// returns an invalid values.
					setTimeout( () => {
						makeChangelog( 'beta', [
							'Changelog',
							'=========',
							'',
							'## [0.2.1](https://githubn.com/ckeditor) (2017-06-08)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							''
						].join( '\n' ) );
						makeCommit( 'beta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

						resolve();
					} );
				} ) );

			stubs.generateChangelogForSinglePackage.onFirstCall()
				.returns( new Promise( resolve => {
					// Without this timeout, the promise is resolving before starting the test and `getPackagesToRelease()`
					// returns an invalid values.
					setTimeout( () => {
						makeChangelog( 'delta', [
							'Changelog',
							'=========',
							'',
							'## [0.4.1](https://githubn.com/ckeditor) (2017-06-08)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							''
						].join( '\n' ) );
						makeCommit( 'delta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

						resolve();
					} );
				} ) );

			stubs.validatePackageToRelease.returns( [] );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipNpm: true,
				skipGithub: true
			} ) );

			stubs.releaseRepository.returns( Promise.resolve() );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.generateChangelogForSinglePackage.calledTwice ).to.equal( true );
					expect( stubs.generateChangelogForSinglePackage.firstCall.args[ 0 ] ).to.equal( '0.2.1' );
					expect( stubs.generateChangelogForSinglePackage.secondCall.args[ 0 ] ).to.equal( '0.4.1' );
				} );
		} );

		it( 'releases packages', () => {
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

			stubs.cli.confirmRelease.returns( Promise.resolve() );

			stubs.generateChangelogForSinglePackage.onFirstCall()
				.returns( new Promise( resolve => {
					// Without this timeout, the promise is resolving before starting the test and `getPackagesToRelease()`
					// returns an invalid values.
					setTimeout( () => {
						makeChangelog( 'delta', [
							'Changelog',
							'=========',
							'',
							'## [0.4.1](https://githubn.com/ckeditor) (2017-06-08)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							''
						].join( '\n' ) );
						makeCommit( 'delta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

						resolve();
					} );
				} ) );

			stubs.generateChangelogForSinglePackage.onSecondCall()
				.returns( new Promise( resolve => {
					// Without this timeout, the promise is resolving before starting the test and `getPackagesToRelease()`
					// returns an invalid values.
					setTimeout( () => {
						makeChangelog( 'epsilon', [
							'Changelog',
							'=========',
							'',
							'## [0.5.1](https://githubn.com/ckeditor) (2017-06-08)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							''
						].join( '\n' ) );
						makeCommit( 'epsilon', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

						resolve();
					} );
				} ) );

			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipNpm: true,
				skipGithub: true
			} ) );

			stubs.validatePackageToRelease.returns( [] );
			stubs.releaseRepository.returns( Promise.resolve() );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.releaseRepository.callCount ).to.equal( 4 );

					// Alpha
					expect( stubs.releaseRepository.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
						skipGithub: true,
						skipNpm: true,
						token: undefined,
						version: '0.1.0',
						changes: [
							'### Features',
							'',
							'* This is an initial commit.'
						].join( '\n' )
					} );

					// Beta
					expect( stubs.releaseRepository.getCall( 1 ).args[ 0 ] ).to.deep.equal( {
						skipGithub: true,
						skipNpm: true,
						token: undefined,
						version: '0.2.1',
						changes: [
							'### Fix',
							'',
							'* Some fix.'
						].join( '\n' )
					} );

					// Delta
					expect( stubs.releaseRepository.getCall( 2 ).args[ 0 ] ).to.deep.equal( {
						skipGithub: true,
						skipNpm: true,
						token: undefined,
						version: '0.4.1',
						changes: 'Internal changes only (updated dependencies, documentation, etc.).'
					} );

					// Epsilon
					expect( stubs.releaseRepository.getCall( 3 ).args[ 0 ] ).to.deep.equal( {
						skipGithub: true,
						skipNpm: true,
						token: undefined,
						version: '0.5.1',
						changes: 'Internal changes only (updated dependencies, documentation, etc.).'
					} );
				} );
		} );

		it( 'must not release any package if any error occured', () => {
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

			stubs.cli.confirmRelease.returns( Promise.resolve() );

			stubs.generateChangelogForSinglePackage.onFirstCall()
				.returns( new Promise( resolve => {
					// Without this timeout, the promise is resolving before starting the test and `getPackagesToRelease()`
					// returns an invalid values.
					setTimeout( () => {
						makeChangelog( 'delta', [
							'Changelog',
							'=========',
							'',
							'## [0.4.1](https://githubn.com/ckeditor) (2017-06-08)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							''
						].join( '\n' ) );
						makeCommit( 'delta', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

						resolve();
					} );
				} ) );

			stubs.generateChangelogForSinglePackage.onSecondCall()
				.returns( new Promise( resolve => {
					// Without this timeout, the promise is resolving before starting the test and `getPackagesToRelease()`
					// returns an invalid values.
					setTimeout( () => {
						makeChangelog( 'epsilon', [
							'Changelog',
							'=========',
							'',
							'## [0.5.1](https://githubn.com/ckeditor) (2017-06-08)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							''
						].join( '\n' ) );
						makeCommit( 'epsilon', 'Docs: Changelog. [skip ci]', [ 'CHANGELOG.md' ] );

						resolve();
					} );
				} ) );

			stubs.validatePackageToRelease.returns( [] );
			stubs.validatePackageToRelease.onFirstCall().returns( [
				'Not on master or master is not clean.'
			] );
			stubs.validatePackageToRelease.onSecondCall().returns( [
				'Cannot find changelog entry for version 0.2.1.'
			] );

			return releaseSubRepositories( options )
				.then( () => {
					expect( stubs.validatePackageToRelease.callCount ).to.equal( 4 );
					expect( stubs.releaseRepository.called ).to.equal( false );

					expect( stubs.logger.error.callCount ).to.equal( 5 );
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Releasing has been aborted due to errors.' );
					expect( stubs.logger.error.getCall( 1 ).args[ 0 ] ).to.equal( '## @ckeditor/alpha' );
					expect( stubs.logger.error.getCall( 2 ).args[ 0 ] ).to.equal( '* Not on master or master is not clean.' );
					expect( stubs.logger.error.getCall( 3 ).args[ 0 ] ).to.equal( '## @ckeditor/beta' );
					expect( stubs.logger.error.getCall( 4 ).args[ 0 ] ).to.equal( '* Cannot find changelog entry for version 0.2.1.' );
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
