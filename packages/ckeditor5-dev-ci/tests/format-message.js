/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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

		describe( 'commit API URL resolution', () => {
			const baseOptions = {
				slackMessageUsername: 'Test',
				iconUrl: 'https://avatars.githubusercontent.com/u/26329082?v=4',
				repositoryOwner: 'ckeditor',
				repositoryName: 'ckeditor5-dev',
				branch: 'master',
				buildTitle: 'Workflow',
				buildUrl: 'https://...',
				buildId: 1,
				githubToken: 'secret-token',
				startTime: 1,
				endTime: 2,
				shouldHideAuthor: false
			};
			const commitResponse = {
				author: { login: 'ExampleNick' },
				commit: { author: { name: 'Example Nick' }, message: 'An example message.' },
				sha: '35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
			};

			beforeEach( () => {
				fetchMock.mockResolvedValue( { json: () => Promise.resolve( commitResponse ) } );
			} );

			it( 'rewrites github.com → api.github.com when `apiUrl` is omitted (legacy path)', async () => {
				await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
				} );

				expect( fetchMock ).toHaveBeenCalledTimes( 1 );
				expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toEqual(
					'https://api.github.com/repos/ckeditor/ckeditor5-dev/commits/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
				);
			} );

			it( 'uses `apiUrl` when provided for public github.com', async () => {
				await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19',
					apiUrl: 'https://api.github.com'
				} );

				expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toEqual(
					'https://api.github.com/repos/ckeditor/ckeditor5-dev/commits/35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
				);
			} );

			it( 'builds the GitHub Enterprise API URL from `apiUrl` regardless of the HTML host', async () => {
				await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.corp.example.com/owner/repo/commit/deadbeef',
					apiUrl: 'https://github.corp.example.com/api/v3'
				} );

				expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toEqual(
					'https://github.corp.example.com/api/v3/repos/owner/repo/commits/deadbeef'
				);
			} );

			it( 'trims a trailing slash from `apiUrl`', async () => {
				await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.com/owner/repo/commit/xyz',
					apiUrl: 'https://api.github.com/'
				} );

				expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toEqual(
					'https://api.github.com/repos/owner/repo/commits/xyz'
				);
			} );
		} );

		describe( 'commit message issue-reference rewriting', () => {
			const baseOptions = {
				slackMessageUsername: 'Test',
				iconUrl: 'https://avatars.githubusercontent.com/u/26329082?v=4',
				repositoryOwner: 'ckeditor',
				repositoryName: 'ckeditor5-dev',
				branch: 'master',
				buildTitle: 'Workflow',
				buildUrl: 'https://...',
				buildId: 1,
				githubToken: 'secret-token',
				startTime: 1,
				endTime: 2,
				shouldHideAuthor: false
			};

			function mockCommit( message ) {
				fetchMock.mockResolvedValue( {
					json: () => Promise.resolve( {
						author: { login: 'ExampleNick' },
						commit: { author: { name: 'Example Nick' }, message },
						sha: '35cbea88dc0b5c00406c9a5f0c357ad2a7195a19'
					} )
				} );
			}

			function getCommitMessageField( message ) {
				return message.attachments[ 0 ].fields.find( field => field.title === 'Commit message' ).value;
			}

			it( 'rewrites ` #<id>` references against the public github.com host', async () => {
				mockCommit( 'Fix bug #42 in the parser.' );

				const message = await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/abc'
				} );

				expect( getCommitMessageField( message ) ).toContain(
					'<https://github.com/ckeditor/ckeditor5-dev/issues/42|#42>'
				);
			} );

			it( 'rewrites ` #<id>` references against the GitHub Enterprise host', async () => {
				mockCommit( 'Fix bug #42 in the parser.' );

				const message = await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.corp.example.com/owner/repo/commit/abc',
					apiUrl: 'https://github.corp.example.com/api/v3'
				} );

				expect( getCommitMessageField( message ) ).toContain(
					'<https://github.corp.example.com/owner/repo/issues/42|#42>'
				);
			} );

			it( 'rewrites cross-repo `owner/repo#<id>` references using the triggering server URL', async () => {
				mockCommit( 'See ckeditor/ckeditor5#10000 for context.' );

				const message = await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.corp.example.com/owner/repo/commit/abc',
					apiUrl: 'https://github.corp.example.com/api/v3'
				} );

				expect( getCommitMessageField( message ) ).toContain(
					'<https://github.corp.example.com/ckeditor/ckeditor5/issues/10000|ckeditor/ckeditor5#10000>'
				);
			} );

			it( 'returns `_Unavailable._` when the commit message is empty', async () => {
				mockCommit( '' );

				const message = await formatMessage( {
					...baseOptions,
					triggeringCommitUrl: 'https://github.com/ckeditor/ckeditor5-dev/commit/abc'
				} );

				expect( getCommitMessageField( message ) ).toEqual( '_Unavailable._' );
			} );
		} );
	} );
} );
