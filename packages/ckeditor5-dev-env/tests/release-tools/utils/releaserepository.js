/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	describe( 'releaseRepository()', () => {
		let releaseRepository, sandbox, stubs, options;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				createGithubRelease: sandbox.stub(),
				generateChangelogForSinglePackage: sandbox.stub(),
				parseGithubUrl: sandbox.stub(),
				getPackageJson: sandbox.stub(),
				logger: {
					info: sandbox.spy(),
					warning: sandbox.spy(),
					error: sandbox.spy()
				},
				tools: {
					shExec: sandbox.stub()
				}
			};

			mockery.registerMock( './creategithubrelease', stubs.createGithubRelease );
			mockery.registerMock( './generatechangelogforsinglepackage', stubs.generateChangelogForSinglePackage );
			mockery.registerMock( 'parse-github-url', stubs.parseGithubUrl );

			sandbox.stub( process, 'cwd' ).returns( '/cwd' );

			releaseRepository = proxyquire( '../../../lib/release-tools/utils/releaserepository', {
				'./getpackagejson': stubs.getPackageJson,
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
				version: '1.0.0',
				changes: 'Changes.'
			};
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'release the package', () => {
			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.tools.shExec.returns( '' );

			return releaseRepository( options )
				.then( () => {
					expect( stubs.parseGithubUrl.calledOnce ).to.equal( false );
					expect( stubs.createGithubRelease.calledOnce ).to.equal( false );
					expect( stubs.tools.shExec.calledWith( 'npm publish --access=public' ) ).to.equal( false );

					expect( stubs.tools.shExec.calledWith( 'npm version 1.0.0 --message "Release: v1.0.0."' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git push origin master v1.0.0' ) ).to.equal( true );
					expect( stubs.logger.info.calledWithMatch( /Release "v1.0.0" has been created and published./ ) )
						.to.equal( true );
				} );
		} );

		it( 'publish package on npm', () => {
			options.skipNpm = false;

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.tools.shExec.returns( '' );
			stubs.parseGithubUrl.returns( {
				owner: 'organization',
				name: 'repository'
			} );

			return releaseRepository( options )
				.then( () => {
					expect( stubs.parseGithubUrl.calledOnce ).to.equal( false );
					expect( stubs.createGithubRelease.calledOnce ).to.equal( false );
					expect( stubs.tools.shExec.calledWith( 'npm version 1.0.0 --message "Release: v1.0.0."' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'git push origin master v1.0.0' ) ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'npm publish --access=public' ) ).to.equal( true );
					expect( stubs.logger.info.calledWithMatch( /Release "v1.0.0" has been created and published./ ) )
						.to.equal( true );
				} );
		} );

		it( 'publish package on GitHub', () => {
			options.skipGithub = false;

			stubs.getPackageJson.returns( {
				name: '@ckeditor/ckeditor5-core'
			} );

			stubs.createGithubRelease.returns( Promise.resolve() );

			stubs.tools.shExec.returns( '' );
			stubs.parseGithubUrl.returns( {
				owner: 'organization',
				name: 'repository'
			} );

			return releaseRepository( options )
				.then( () => {
					expect( stubs.parseGithubUrl.calledOnce ).to.equal( true );
					expect( stubs.createGithubRelease.calledOnce ).to.equal( true );
					expect( stubs.tools.shExec.calledWith( 'npm publish --access=public' ) ).to.equal( false );

					expect( stubs.logger.info.calledWithMatch( /Release "v1.0.0" has been created and published./ ) )
						.to.equal( true );

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
