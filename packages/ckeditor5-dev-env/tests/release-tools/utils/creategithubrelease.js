/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	describe( 'createGithubRelease()', () => {
		let createGithubRelease, sandbox, stubs, octokitOptions;

		beforeEach( () => {
			octokitOptions = null;
			sandbox = sinon.createSandbox();

			stubs = {
				authenticate: sandbox.stub(),
				createRelease: sandbox.stub()
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( '@octokit/rest', {
				Octokit: function GitHubApi( options ) {
					octokitOptions = options;

					this.authenticate = stubs.authenticate;
					this.repos = {
						createRelease: stubs.createRelease
					};
				}
			} );

			createGithubRelease = require( '../../../lib/release-tools/utils/creategithubrelease' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'must not use "octokit.authenticate()" method', () => {
			stubs.createRelease.resolves();

			const options = {
				repositoryOwner: 'organization',
				repositoryName: 'repository',
				version: 'v1.0.0',
				description: 'Changes.'
			};

			return createGithubRelease( 'token-123', options )
				.then( () => {
					expect( stubs.authenticate.called ).to.equal( false );
					expect( octokitOptions ).to.deep.equal( {
						version: '3.0.0',
						auth: 'token token-123'
					} );
				} );
		} );

		it( 'uses GitHub API to create a release', () => {
			stubs.createRelease.resolves( { done: true } );

			const options = {
				repositoryOwner: 'organization',
				repositoryName: 'repository',
				version: 'v1.0.0',
				description: 'Changes.'
			};

			return createGithubRelease( 'token-123', options )
				.then( response => {
					expect( response ).to.deep.equal( { done: true } );
					expect( stubs.createRelease.calledOnce ).to.equal( true );

					expect( stubs.createRelease.firstCall.args[ 0 ] ).to.deep.equal( {
						owner: 'organization',
						repo: 'repository',
						tag_name: 'v1.0.0',
						body: 'Changes.'
					} );
				} );
		} );

		it( 'rejects promise when something went wrong', () => {
			const error = new Error( 'Unexpected error.' );
			stubs.createRelease.rejects( error );

			return createGithubRelease( 'token-123', {} )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);
		} );
	} );
} );
