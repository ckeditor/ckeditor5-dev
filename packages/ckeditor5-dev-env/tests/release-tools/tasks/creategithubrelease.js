/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/tasks', () => {
	describe( 'createGithubRelease()', () => {
		let createGithubRelease, sandbox, stubs, error;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				authenticate: sandbox.stub(),
				createRelease: sandbox.spy( ( options, callback ) => {
					if ( error ) {
						return callback( error );
					}

					callback( null, 'Response.' );
				} )
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'github', function GitHubApi() {
				return {
					authenticate: stubs.authenticate,
					repos: {
						createRelease: stubs.createRelease
					}
				};
			} );

			createGithubRelease = require( '../../../lib/release-tools/tasks/creategithubrelease' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'uses GitHub API to create a release', () => {
			const options = {
				repositoryOwner: 'organization',
				repositoryName: 'repository',
				version: 'v1.0.0',
				description: 'Changes.'
			};

			return createGithubRelease( 'token-123', options )
				.then( response => {
					expect( response ).to.equal( 'Response.' );

					expect( stubs.authenticate.calledOnce ).to.equal( true );
					expect( stubs.authenticate.firstCall.args[ 0 ] ).to.deep.equal( {
						token: 'token-123',
						type: 'oauth'
					} );

					expect( stubs.createRelease.calledOnce ).to.equal( true );

					// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
					expect( stubs.createRelease.firstCall.args[ 0 ] ).to.deep.equal( {
						owner: 'organization',
						repo: 'repository',
						tag_name: 'v1.0.0',
						body: 'Changes.'
					} );
					// jscs:enable requireCamelCaseOrUpperCaseIdentifiers
				} );
		} );

		it( 'rejects promise when something went wrong', () => {
			error = new Error( 'Unexpected error.' );

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
