/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/index', () => {
	let tasks, sandbox, execOptions, stubs, packagesToRelease;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		packagesToRelease = new Map();

		stubs = {
			cli: {
				confirmRelease: sandbox.stub(),
				configureReleaseOptions: sandbox.stub(),
			},
			validator: {
				checkBranch: sandbox.stub(),
			},
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			getPackagesToRelease: sandbox.stub()
		};

		mockery.registerMock( './release-tools/utils/executeondependencies', ( options, functionToExecute ) => {
			execOptions = options;

			const packagesPath = path.join( options.cwd, options.packages );

			let promise = Promise.resolve();

			for ( const item of packagesToRelease.keys() ) {
				promise = promise.then( () => {
					return functionToExecute( item, path.join( packagesPath, item.replace( '@', '' ) ) );
				} );
			}

			// This package won't be released because `packagesToRelease` won't attach the package to dependencies to release.
			// But, the package is a dependency and `executeOnDependencies` will try to execute the release task with this package.
			// We need to manually check whether the package should be released.
			promise = promise.then( () => {
				const item = '@ckeditor/ckeditor5-utils';

				return functionToExecute( item, path.join( packagesPath, item.replace( '@', '' ) ) );
			} );

			return promise;
		} );

		mockery.registerMock( './release-tools/utils/getpackagestorelease', stubs.getPackagesToRelease );

		mockery.registerMock( './release-tools/utils/cli', stubs.cli );

		mockery.registerMock( './release-tools/utils/releasevalidator', stubs.validator );

		tasks = proxyquire( '../lib/index', {
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
	} );

	describe( 'generateChangelog()', () => {
		it( 'should be defined', () => {
			expect( tasks.generateChangelog ).to.be.a( 'function' );
		} );
	} );

	describe( 'generateChangelogForDependencies()', () => {
		it( 'executes "generateChangeLog" task on each package', () => {
			const generateChangelogStub = sandbox.stub( tasks, 'generateChangelog' ).returns( Promise.resolve() );

			const chdirStub = sandbox.stub( process, 'chdir' );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			return tasks.generateChangelogForDependencies( options )
				.then( () => {
					expect( execOptions ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages
					} );

					expect( chdirStub.called ).to.equal( true );

					// ckeditor5-utils is a dependency found by `executeOnDependencies` function.
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-utils$/ );
					expect( generateChangelogStub.calledOnce ).to.equal( true );
				} );
		} );
	} );

	describe( 'createRelease()', () => {
		it( 'should be defined', () => {
			expect( tasks.createRelease ).to.be.a( 'function' );
		} );
	} );

	describe( 'releaseDependencies()', () => {
		it( 'executes "createRelease" task on each package to release', () => {
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' ).returns( Promise.resolve() );

			const chdirStub = sandbox.stub( process, 'chdir' );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', { version: '0.6.0', hasChangelog: true } );
			packagesToRelease.set( '@ckeditor/ckeditor5-engine', { version: '1.0.1', hasChangelog: true } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipGithub: false,
				skipNpm: true,
				token: 'secret-token-to-github-account'
			} ) );
			stubs.validator.checkBranch.returns( undefined );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			return tasks.releaseDependencies( options )
				.then( () => {
					expect( execOptions ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						skipPackages: []
					} );

					expect( chdirStub.called ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( chdirStub.secondCall.args[ 0 ] ).to.match( /ckeditor5-engine$/ );
					expect( chdirStub.calledWithMatch( /ckeditor5-utils$/ ) ).to.equal( false );

					expect( createReleaseStub.calledTwice ).to.equal( true );

					const releaseArguments = {
						skipGithub: false,
						skipNpm: true,
						token: 'secret-token-to-github-account',
						dependencies: packagesToRelease
					};

					expect( createReleaseStub.firstCall.args[ 0 ] ).to.deep.equal( releaseArguments );
					expect( createReleaseStub.secondCall.args[ 0 ] ).to.deep.equal( releaseArguments );
				} );
		} );

		it( 'does not release anything when list with packages to release is empty', () => {
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' ).returns( Promise.resolve() );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			return tasks.releaseDependencies( options )
				.then( () => {
					const expectedError = 'None of the packages contains any changes since its last release. Aborting.';

					expect( createReleaseStub.called ).to.equal( false );
					expect( stubs.logger.error.calledOnce ).to.equal( true );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( expectedError );
				} );
		} );

		it( 'does not release anything when packages are not prepared for the release', () => {
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' ).returns( Promise.resolve() );

			sandbox.stub( process, 'chdir' );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', { version: '0.6.0', hasChangelog: true } );
			packagesToRelease.set( '@ckeditor/ckeditor5-engine', { version: '1.0.1', hasChangelog: true } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );
			stubs.validator.checkBranch.throws( new Error( 'Not on master or master is not clean.' ) );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			return tasks.releaseDependencies( options )
				.then( () => {
					expect( createReleaseStub.called ).to.equal( false );
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Releasing has been aborted due to errors.' );
					expect( stubs.logger.error.getCall( 1 ).args[ 0 ] ).to.equal( '## @ckeditor/ckeditor5-core' );
					expect( stubs.logger.error.getCall( 2 ).args[ 0 ] ).to.equal( 'Not on master or master is not clean.' );
					expect( stubs.logger.error.getCall( 3 ).args[ 0 ] ).to.equal( '## @ckeditor/ckeditor5-engine' );
					expect( stubs.logger.error.getCall( 4 ).args[ 0 ] ).to.equal( 'Not on master or master is not clean.' );
				} );
		} );

		it( 'does not release anything when user aborted', () => {
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' ).returns( Promise.resolve() );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			packagesToRelease.set( '@ckeditor/ckeditor5-core', { version: '0.6.0', hasChangelog: true } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( false ) );

			return tasks.releaseDependencies( options )
				.then( () => {
					expect( createReleaseStub.called ).to.equal( false );
				} );
		} );

		it( 'breaks the whole process when unexpected error occurs', () => {
			const error = new Error( 'Unexpected error.' );
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' );

			sandbox.stub( process, 'chdir' );

			createReleaseStub.onFirstCall().returns( Promise.resolve() );
			createReleaseStub.onSecondCall().throws( error );

			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipGithub: true,
				skipNpm: true
			} ) );

			stubs.validator.checkBranch.returns( undefined );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', { version: '0.6.0', hasChangelog: true } );
			packagesToRelease.set( '@ckeditor/ckeditor5-engine', { version: '1.0.0', hasChangelog: true } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );

			const options = {
				cwd: __dirname,
				packages: 'packages/'
			};

			return tasks.releaseDependencies( options )
				.then( () => {
					expect( process.exitCode ).to.equal( -1 );
					expect( createReleaseStub.calledTwice ).to.equal( true );
					expect( stubs.logger.error.calledOnce ).to.equal( true );
					expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( error.message );
				} );
		} );

		it( 'does not release specified packages', () => {
			const createReleaseStub = sandbox.stub( tasks, 'createRelease' ).returns( Promise.resolve() );

			const chdirStub = sandbox.stub( process, 'chdir' );

			packagesToRelease.set( '@ckeditor/ckeditor5-core', { version: '0.6.0', hasChangelog: true } );

			stubs.getPackagesToRelease.returns( Promise.resolve( packagesToRelease ) );

			stubs.cli.confirmRelease.returns( Promise.resolve( true ) );
			stubs.cli.configureReleaseOptions.returns( Promise.resolve( {
				skipGithub: false,
				skipNpm: true,
				token: 'secret-token-to-github-account'
			} ) );
			stubs.validator.checkBranch.returns( undefined );

			const options = {
				cwd: __dirname,
				packages: 'packages/',
				skipPackages: [
					'@ckeditor/ckeditor5-engine'
				]
			};

			return tasks.releaseDependencies( options )
				.then( () => {
					expect( execOptions ).to.deep.equal( {
						cwd: options.cwd,
						packages: options.packages,
						skipPackages: options.skipPackages
					} );

					expect( chdirStub.called ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( chdirStub.calledWithMatch( /ckeditor5-engine$/ ) ).to.equal( false );

					expect( createReleaseStub.calledOnce ).to.equal( true );

					const releaseArguments = {
						skipGithub: false,
						skipNpm: true,
						token: 'secret-token-to-github-account',
						dependencies: packagesToRelease
					};

					expect( createReleaseStub.firstCall.args[ 0 ] ).to.deep.equal( releaseArguments );
				} );
		} );
	} );
} );
