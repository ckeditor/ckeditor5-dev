/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'lib/format-message', () => {
	let formatMessage, stubs;

	beforeEach( () => {
		stubs = {
			nodeFetch: sinon.stub()
		};

		formatMessage = proxyquire( '../lib/format-message', {
			'node-fetch': stubs.nodeFetch
		} );
	} );

	describe( 'formatMessage()', () => {
		it( 'should be a function', () => {
			expect( formatMessage ).to.be.a( 'function' );
		} );

		it( 'should display a message for bot if a login is included in the "bots" array', async () => {
			stubs.nodeFetch.resolves( {
				json() {
					return Promise.resolve( {
						author: {
							login: 'CKCSBot'
						},
						commit: {
							author: {
								name: 'CKCSBot'
							},
							message: 'An example message.'
						},
						sha: '35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
					} );
				}
			} );

			const message = await formatMessage( {
				slackMessageUsername: 'Test',
				iconUrl: 'https://avatars.githubusercontent.com/u/26329082?v=4',
				repositoryOwner: 'ckeditor',
				repositoryName: 'ckeditor5-dev',
				branch: 'master',
				buildTitle: 'Workflow',
				buildUrl: 'https://...',
				buildId: 1,
				githubToken: 'secret-token',
				triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19',
				startTime: 1,
				endTime: 2,
				shouldHideAuthor: false
			} );

			expect( message ).to.be.an( 'object' );
			expect( message ).to.have.property( 'text' );
			expect( message.text ).to.equal( '_Automated stuff happened on one of the branches. Got time to have a look at it, anyone?_' );
		} );

		it( 'should display a message for bot if a login is unavailable but author name is included in the "bots" array', async () => {
			stubs.nodeFetch.resolves( {
				json() {
					return Promise.resolve( {
						author: null,
						commit: {
							author: {
								name: 'CKCSBot'
							},
							message: 'An example message.'
						},
						sha: '35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
					} );
				}
			} );

			const message = await formatMessage( {
				slackMessageUsername: 'Test',
				iconUrl: 'https://avatars.githubusercontent.com/u/26329082?v=4',
				repositoryOwner: 'ckeditor',
				repositoryName: 'ckeditor5-dev',
				branch: 'master',
				buildTitle: 'Workflow',
				buildUrl: 'https://...',
				buildId: 1,
				githubToken: 'secret-token',
				triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19',
				startTime: 1,
				endTime: 2,
				shouldHideAuthor: false
			} );

			expect( message ).to.be.an( 'object' );
			expect( message ).to.have.property( 'text' );
			expect( message.text ).to.equal( '_Automated stuff happened on one of the branches. Got time to have a look at it, anyone?_' );
		} );

		it( 'should mention the channel if a login is unavailable and author name is not included in the "bots" array', async () => {
			stubs.nodeFetch.resolves( {
				json() {
					return Promise.resolve( {
						author: null,
						commit: {
							author: {
								name: 'CKEditor5DevopsBot'
							},
							message: 'An example message.'
						},
						sha: '35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
					} );
				}
			} );

			const message = await formatMessage( {
				slackMessageUsername: 'Test',
				iconUrl: 'https://avatars.githubusercontent.com/u/26329082?v=4',
				repositoryOwner: 'ckeditor',
				repositoryName: 'ckeditor5-dev',
				branch: 'master',
				buildTitle: 'Workflow',
				buildUrl: 'https://...',
				buildId: 1,
				githubToken: 'secret-token',
				triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19',
				startTime: 1,
				endTime: 2,
				shouldHideAuthor: false
			} );

			expect( message ).to.be.an( 'object' );
			expect( message ).to.have.property( 'text' );
			expect( message.text ).to.equal( '<!channel> (CKEditor5DevopsBot), could you take a look?' );
		} );
	} );
} );
