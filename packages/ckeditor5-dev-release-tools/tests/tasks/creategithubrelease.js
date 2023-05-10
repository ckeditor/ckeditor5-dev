/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/tasks', () => {
	describe( 'createGithubRelease()', () => {
		let options, stubs, constructorOptionsCapture, createGithubRelease;

		beforeEach( () => {
			options = {
				token: 'abc123',
				version: '1.3.5',
				repositoryOwner: 'mrSmith',
				repositoryName: 'epic-project',
				description: 'Very important release.',
				isPrerelease: false
			};

			stubs = {
				octokit: {
					repos: {
						createRelease: sinon.stub().resolves()
					}
				},
				console: {
					log: sinon.stub( console, 'log' )
				}
			};

			class Octokit {
				constructor( options ) {
					constructorOptionsCapture = options;

					this.repos = stubs.octokit.repos;
				}
			}

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( '@octokit/rest', { Octokit } );

			createGithubRelease = require( '../../lib/tasks/creategithubrelease' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sinon.restore();
		} );

		it( 'should be a function', () => {
			expect( createGithubRelease ).to.be.a( 'function' );
		} );

		it( 'creates new Octokit instance with correct arguments', async () => {
			await createGithubRelease( options );

			expect( constructorOptionsCapture ).to.deep.equal( {
				version: '3.0.0',
				auth: 'token abc123'
			} );
		} );

		it( 'creates the release with correct arguments', async () => {
			await createGithubRelease( options );

			expect( stubs.octokit.repos.createRelease.callCount ).to.equal( 1 );
			expect( stubs.octokit.repos.createRelease.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.octokit.repos.createRelease.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
				tag_name: 'v1.3.5',
				owner: 'mrSmith',
				repo: 'epic-project',
				body: 'Very important release.',
				prerelease: false
			} );
		} );

		it( 'logs the information about success', async () => {
			await createGithubRelease( options );

			expect( stubs.console.log.callCount ).to.equal( 1 );
			expect( stubs.console.log.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.console.log.getCall( 0 ).args[ 0 ] ).to.equal(
				'Created the release on GitHub: https://github.com/mrSmith/epic-project/releases/tag/v1.3.5'
			);
		} );

		it( 'logs the information about failure', async () => {
			stubs.octokit.repos.createRelease.rejects( { message: 'Release error.' } );

			await createGithubRelease( options );

			expect( stubs.console.log.callCount ).to.equal( 2 );
			expect( stubs.console.log.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.console.log.getCall( 0 ).args[ 0 ] ).to.equal( 'An error occurred while creating the release on GitHub:' );
			expect( stubs.console.log.getCall( 1 ).args.length ).to.equal( 1 );
			expect( stubs.console.log.getCall( 1 ).args[ 0 ] ).to.equal( 'Release error.' );
		} );
	} );
} );
