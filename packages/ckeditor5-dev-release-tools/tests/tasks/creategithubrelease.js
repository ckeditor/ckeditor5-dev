/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
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
				repositoryOwner: 'ckeditor',
				repositoryName: 'ckeditor5-dev',
				description: 'Very important release.'
			};

			stubs = {
				octokit: {
					repos: {
						createRelease: sinon.stub().resolves(),
						getLatestRelease: sinon.stub().rejects( {
							status: 404
						} )
					}
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

		it( 'resolves a url to the created page', async () => {
			const url = await createGithubRelease( options );

			expect( url ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev/releases/tag/v1.3.5' );
		} );

		it( 'creates a non-prerelease page when passing a major.minor.patch version', async () => {
			await createGithubRelease( options );

			expect( stubs.octokit.repos.createRelease.callCount ).to.equal( 1 );
			expect( stubs.octokit.repos.createRelease.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.octokit.repos.createRelease.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
				tag_name: 'v1.3.5',
				owner: 'ckeditor',
				repo: 'ckeditor5-dev',
				body: 'Very important release.',
				prerelease: false
			} );
		} );

		it( 'creates a prerelease page when passing a major.minor.patch-prerelease version', async () => {
			options.version = '1.3.5-alpha.0';
			await createGithubRelease( options );

			expect( stubs.octokit.repos.createRelease.callCount ).to.equal( 1 );
			expect( stubs.octokit.repos.createRelease.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.octokit.repos.createRelease.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
				tag_name: 'v1.3.5-alpha.0',
				owner: 'ckeditor',
				repo: 'ckeditor5-dev',
				body: 'Very important release.',
				prerelease: true
			} );
		} );

		it( 'creates a new release if the previous release version are different', async () => {
			stubs.octokit.repos.getLatestRelease.resolves( {
				data: {
					tag_name: 'v1.3.4'
				}
			} );

			await createGithubRelease( options );

			expect( stubs.octokit.repos.createRelease.callCount ).to.equal( 1 );
		} );

		it( 'does not create a new release if the previous release version are the same', async () => {
			stubs.octokit.repos.getLatestRelease.resolves( {
				data: {
					tag_name: 'v1.3.5'
				}
			} );

			const url = await createGithubRelease( options );

			expect( url ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev/releases/tag/v1.3.5' );
			expect( stubs.octokit.repos.createRelease.callCount ).to.equal( 0 );
		} );
	} );
} );
