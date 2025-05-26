/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import formatMessage from '../lib/format-message.js';

vi.mock( '../lib/data', () => {
	return {
		members: {
			ExampleNick: 'slackId'
		},
		bots: [
			'CKCSBot'
		]
	};
} );

describe( 'lib/format-message', () => {
	describe( 'formatMessage()', () => {
		let fetchMock;

		beforeEach( () => {
			fetchMock = vi.fn();
			vi.stubGlobal( 'fetch', fetchMock );
		} );

		it( 'should be a function', () => {
			expect( formatMessage ).toBeInstanceOf( Function );
		} );

		it( 'should display a message for bot if a login is included in the "bots" array', async () => {
			vi.mocked( fetchMock ).mockResolvedValueOnce( {
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
			vi.mocked( fetchMock ).mockResolvedValueOnce( {
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
			vi.mocked( fetchMock ).mockResolvedValueOnce( {
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

		it( 'should find a Slack account based on a GitHub account case-insensitive', async () => {
			vi.mocked( fetchMock ).mockResolvedValueOnce( {
				json() {
					return Promise.resolve( {
						author: {
							login: 'exampleNICK'
						},
						commit: {
							author: {
								name: 'Example Nick'
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
			expect( message.text ).toEqual( '<@slackId>, could you take a look?' );
		} );
	} );
} );
