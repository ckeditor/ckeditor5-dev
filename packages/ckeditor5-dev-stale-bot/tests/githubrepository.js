/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import prepareSearchQuery from '../lib/utils/preparesearchquery.js';
import isIssueOrPullRequestToStale from '../lib/utils/isissueorpullrequesttostale.js';
import isIssueOrPullRequestToUnstale from '../lib/utils/isissueorpullrequesttounstale.js';
import isIssueOrPullRequestToClose from '../lib/utils/isissueorpullrequesttoclose.js';
import isPendingIssueToStale from '../lib/utils/ispendingissuetostale.js';
import isPendingIssueToUnlabel from '../lib/utils/ispendingissuetounlabel.js';
import GitHubRepository from '../lib/githubrepository.js';

vi.mock( '../lib/utils/preparesearchquery' );
vi.mock( '../lib/utils/isissueorpullrequesttostale' );
vi.mock( '../lib/utils/isissueorpullrequesttounstale' );
vi.mock( '../lib/utils/isissueorpullrequesttoclose' );
vi.mock( '../lib/utils/ispendingissuetostale' );
vi.mock( '../lib/utils/ispendingissuetounlabel' );

const {
	fsReadFileMock,
	loggerInfoMock,
	loggerErrorMock,
	graphQLClientConstructorSpy,
	graphQLClientRequestMock
} = vi.hoisted( () => {
	return {
		fsReadFileMock: vi.fn(),
		loggerInfoMock: vi.fn(),
		loggerErrorMock: vi.fn(),
		graphQLClientConstructorSpy: vi.fn(),
		graphQLClientRequestMock: vi.fn()

	};
} );

vi.mock( 'fs/promises', () => {
	return {
		default: {
			readFile: fsReadFileMock
		}
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => {
	return {
		logger: () => {
			return {
				info: loggerInfoMock,
				error: loggerErrorMock
			};
		}
	};
} );

vi.mock( 'graphql-request', () => {
	return {
		GraphQLClient: class {
			constructor( ...args ) {
				graphQLClientConstructorSpy( ...args );

				this.request = graphQLClientRequestMock;
			}
		}
	};
} );

describe( 'dev-stale-bot/lib', () => {
	describe( 'GitHubRepository', () => {
		let githubRepository, pageInfoNoNextPage, pageInfoWithNextPage;

		beforeEach( () => {
			vi.mocked( prepareSearchQuery ).mockReturnValue( 'search query' );
			vi.mocked( isIssueOrPullRequestToStale ).mockReturnValue( true );
			vi.mocked( isIssueOrPullRequestToUnstale ).mockReturnValue( true );
			vi.mocked( isIssueOrPullRequestToClose ).mockReturnValue( true );
			vi.mocked( isPendingIssueToStale ).mockReturnValue( true );
			vi.mocked( isPendingIssueToUnlabel ).mockReturnValue( true );

			vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {} );

			pageInfoWithNextPage = {
				hasNextPage: true,
				cursor: 'cursor'
			};

			pageInfoNoNextPage = {
				hasNextPage: false,
				cursor: 'cursor'
			};

			const queries = {
				'getviewerlogin.graphql': 'query GetViewerLogin',
				'searchissuesorpullrequests.graphql': 'query SearchIssuesOrPullRequests',
				'searchpendingissues.graphql': 'query SearchPendingIssues',
				'getissueorpullrequesttimelineitems.graphql': 'query GetIssueOrPullRequestTimelineItems',
				'addcomment.graphql': 'mutation AddComment',
				'getlabels.graphql': 'query GetLabels',
				'addlabels.graphql': 'mutation AddLabels',
				'removelabels.graphql': 'mutation RemoveLabels',
				'closeissue.graphql': 'mutation CloseIssue',
				'closepullrequest.graphql': 'mutation ClosePullRequest'
			};

			vi.mocked( fsReadFileMock ).mockImplementation( path => queries[ upath.basename( path ) ] );

			githubRepository = new GitHubRepository( 'authorization-token' );
		} );

		describe( '#constructor()', () => {
			it( 'should create a new instance of GraphQLClient', () => {
				expect( graphQLClientConstructorSpy ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'should pass the API URL to the GraphQLClient instance', () => {
				expect( graphQLClientConstructorSpy ).toHaveBeenCalledWith(
					'https://api.github.com/graphql',
					expect.any( Object )
				);
			} );

			it( 'should pass the authorization token to the GraphQLClient instance', () => {
				expect( graphQLClientConstructorSpy ).toHaveBeenCalledWith(
					expect.any( String ),
					expect.objectContaining( {
						headers: expect.objectContaining( {
							Authorization: 'Bearer authorization-token'
						} )
					} )
				);
			} );

			it( 'should pass a proper "Accept" header to the GraphQLClient instance', () => {
				expect( graphQLClientConstructorSpy ).toHaveBeenCalledWith(
					expect.any( String ),
					expect.objectContaining( {
						headers: expect.objectContaining( {
							Accept: 'application/vnd.github.bane-preview+json'
						} )
					} )
				);
			} );

			it( 'should switch to the new global GitHub ID namespace in the GraphQLClient instance', () => {
				expect( graphQLClientConstructorSpy ).toHaveBeenCalledWith(
					expect.any( String ),
					expect.objectContaining( {
						headers: expect.objectContaining( {
							'X-Github-Next-Global-ID': 1
						} )
					} )
				);
			} );

			it( 'should disable the cache in the GraphQLClient instance', () => {
				expect( graphQLClientConstructorSpy ).toHaveBeenCalledWith(
					expect.any( String ),
					expect.objectContaining( {
						cache: 'no-store'
					} )
				);
			} );
		} );

		describe( '#getViewerLogin()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.getViewerLogin ).toBeInstanceOf( Function );
			} );

			it( 'should return viewer login', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					viewer: {
						login: 'CKEditorBot'
					}
				} );

				const result = await githubRepository.getViewerLogin();

				expect( result ).toEqual( 'CKEditorBot' );
			} );

			it( 'should send one request for viewer login', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					viewer: {
						login: 'CKEditorBot'
					}
				} );

				await githubRepository.getViewerLogin();

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'query GetViewerLogin',
					{}
				);
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.getViewerLogin().then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.getViewerLogin().then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#getViewerLogin()".',
							error
						);
					}
				);
			} );
		} );

		describe( '#getIssueOrPullRequestTimelineItems()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.getIssueOrPullRequestTimelineItems ).toBeInstanceOf( Function );
			} );

			it( 'should return all timeline events if they are not paginated', async () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z' }
				];

				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					node: {
						timelineItems: {
							nodes: timelineItems,
							pageInfo: pageInfoNoNextPage
						}
					}
				} );

				const result = await githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' );

				expect( result ).toEqual( [
					{ eventDate: '2022-12-01T09:00:00Z' },
					{ eventDate: '2022-12-02T09:00:00Z' },
					{ eventDate: '2022-12-03T09:00:00Z' }
				] );
			} );

			it( 'should return all timeline events if they are paginated', async () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z' }
				];

				paginateRequest( timelineItems, ( { nodes, pageInfo } ) => {
					return {
						node: {
							timelineItems: {
								nodes,
								pageInfo
							}
						}
					};
				} );

				const result = await githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' );

				expect( result ).toEqual( [
					{ eventDate: '2022-12-01T09:00:00Z' },
					{ eventDate: '2022-12-02T09:00:00Z' },
					{ eventDate: '2022-12-03T09:00:00Z' }
				] );
			} );

			it( 'should send one request for all timeline events if they are not paginated', async () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z' }
				];

				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					node: {
						timelineItems: {
							nodes: timelineItems,
							pageInfo: pageInfoNoNextPage
						}
					}
				} );

				await githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'query GetIssueOrPullRequestTimelineItems',
					{ nodeId: 'IssueId', cursor: null }
				);
			} );

			it( 'should send multiple requests for all timeline events if they are paginated', async () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z' }
				];

				paginateRequest( timelineItems, ( { nodes, pageInfo } ) => {
					return {
						node: {
							timelineItems: {
								nodes,
								pageInfo
							}
						}
					};
				} );

				await githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 3 );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith( 1,
					'query GetIssueOrPullRequestTimelineItems',
					{ nodeId: 'IssueId', cursor: null }
				);

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith( 2,
					'query GetIssueOrPullRequestTimelineItems',
					{ nodeId: 'IssueId', cursor: 'cursor' }
				);

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith( 3,
					'query GetIssueOrPullRequestTimelineItems',
					{ nodeId: 'IssueId', cursor: 'cursor' }
				);
			} );

			it( 'should return event date, event author and label if any of these exist', async () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ updatedAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z', actor: { login: 'RandomUser' } },
					{ createdAt: '2022-12-04T09:00:00Z', author: { login: 'RandomUser' } },
					{ createdAt: '2022-12-05T09:00:00Z', label: { name: 'type:bug' } }
				];

				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					node: {
						timelineItems: {
							nodes: timelineItems,
							pageInfo: pageInfoNoNextPage
						}
					}
				} );

				const result = await githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' );

				expect( result ).toEqual( [
					{ eventDate: '2022-12-01T09:00:00Z' },
					{ eventDate: '2022-12-02T09:00:00Z' },
					{ eventDate: '2022-12-03T09:00:00Z', author: 'RandomUser' },
					{ eventDate: '2022-12-04T09:00:00Z', author: 'RandomUser' },
					{ eventDate: '2022-12-05T09:00:00Z', label: 'type:bug' }
				] );
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should reject if subsequent request failed', () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ error: new Error( '500 Internal Server Error' ) }
				];

				paginateRequest( timelineItems, ( { nodes, pageInfo } ) => {
					return {
						node: {
							timelineItems: {
								nodes,
								pageInfo
							}
						}
					};
				} );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#getIssueOrPullRequestTimelineItems()".', error
						);
					}
				);
			} );
		} );

		describe( 'searching', () => {
			let onProgress, optionsBase, issueBase;

			beforeEach( () => {
				onProgress = vi.fn();

				optionsBase = {
					repositorySlug: 'ckeditor/ckeditor5',
					staleDate: '2022-12-01',
					staleLabels: [ 'status:stale' ],
					pendingIssueLabels: [ 'pending:feedback' ],
					ignoredIssueLabels: [],
					ignoredPullRequestLabels: [],
					ignoredActivityLogins: [],
					ignoredActivityLabels: []
				};

				issueBase = {
					type: 'Issue',
					id: 'IssueId',
					title: 'IssueTitle',
					url: 'https://github.com/',
					number: 1,
					createdAt: '2022-11-30T23:59:59Z',
					lastEditedAt: null,
					reactions: {
						nodes: [],
						pageInfo: pageInfoNoNextPage
					},
					timelineItems: {
						nodes: [],
						pageInfo: pageInfoNoNextPage
					},
					comments: {
						nodes: []
					},
					labels: {
						nodes: []
					}
				};
			} );

			describe( '#searchIssuesOrPullRequestsToStale()', () => {
				it( 'should be a function', () => {
					expect( githubRepository.searchIssuesOrPullRequestsToStale ).toBeInstanceOf( Function );
				} );

				it( 'should ask for issue search query', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					const options = {
						...optionsBase,
						ignoredIssueLabels: [ 'support:1', 'support:2', 'support:3' ]
					};

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', options, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith( {
						type: 'Issue',
						searchDate: '2022-12-01',
						repositorySlug: 'ckeditor/ckeditor5',
						ignoredLabels: [ 'status:stale', 'support:1', 'support:2', 'support:3' ]
					} );
				} );

				it( 'should ask for pull request search query', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					const options = {
						...optionsBase,
						ignoredPullRequestLabels: [ 'support:1', 'support:2', 'support:3' ]
					};

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'PullRequest', options, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith( {
						type: 'PullRequest',
						searchDate: '2022-12-01',
						repositorySlug: 'ckeditor/ckeditor5',
						ignoredLabels: [ 'status:stale', 'support:1', 'support:2', 'support:3' ]
					} );
				} );

				it( 'should start the search from stale date if search date is not set', async () => {
					const options = {
						...optionsBase,
						searchDate: undefined,
						staleDate: '2023-01-01'
					};

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: 0,
							nodes: [],
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', options, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith(
						expect.objectContaining( { 'searchDate': '2023-01-01' } )
					);
				} );

				it( 'should return all issues to stale if they are not paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					const result = await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( result ).toEqual( [
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' },
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' },
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
					] );
				} );

				it( 'should return all issues to stale if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					const result = await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( result ).toEqual( [
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' },
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' },
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
					] );
				} );

				it( 'should send one request for all issues to stale if they are not paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
						'query SearchIssuesOrPullRequests', { query: 'search query', cursor: null }
					);
				} );

				it( 'should send multiple requests for all issues to stale if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						1, 'query SearchIssuesOrPullRequests', { query: 'search query', cursor: null }
					);
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						2, 'query SearchIssuesOrPullRequests', { query: 'search query', cursor: 'cursor' }
					);
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						3, 'query SearchIssuesOrPullRequests', { query: 'search query', cursor: 'cursor' }
					);
				} );

				it( 'should fetch all timeline events for any issue if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1, timelineItems: {
							nodes: [],
							pageInfo: pageInfoWithNextPage
						} }
					];

					githubRepository.getIssueOrPullRequestTimelineItems = vi.fn().mockResolvedValue( [] );

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( vi.mocked( githubRepository.getIssueOrPullRequestTimelineItems ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( githubRepository.getIssueOrPullRequestTimelineItems ) ).toHaveBeenCalledWith(
						'IssueId', { hasNextPage: true, cursor: 'cursor' }
					);
				} );

				it( 'should ask for a new search query with new offset if GitHub prevents going to the next page', async () => {
					const issues = [
						{ ...issueBase, number: 1, createdAt: '2022-11-01T09:00:00Z' },
						{ ...issueBase, number: 2, createdAt: '2022-10-01T09:00:00Z' },
						{ ...issueBase, number: 3, createdAt: '2022-09-01T09:00:00Z' }
					];

					paginateRequest( issues, ( { nodes } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo: pageInfoNoNextPage
							}
						};
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						1, expect.objectContaining( { searchDate: '2022-12-01' } )
					);
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						2, expect.objectContaining( { searchDate: '2022-11-01T09:00:00Z' } )
					);
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						3, expect.objectContaining( { searchDate: '2022-10-01T09:00:00Z' } )
					);
				} );

				it( 'should return all issues to stale if GitHub prevents going to the next page', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo: pageInfoNoNextPage
							}
						};
					} );

					const result = await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( result ).toBeInstanceOf( Array );
					expect( result.length ).toEqual( 3 );
					expect( result ).toEqual( [
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' },
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' },
						{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
					] );
				} );

				it( 'should check each issue if it is stale', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					vi.mocked( isIssueOrPullRequestToStale ).mockReturnValueOnce( true );
					vi.mocked( isIssueOrPullRequestToStale ).mockReturnValueOnce( false );

					const result = await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					const expectedIssue = {
						...issueBase,
						lastReactedAt: null,
						timelineItems: []
					};

					expect( vi.mocked( isIssueOrPullRequestToStale ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( isIssueOrPullRequestToStale ) ).toHaveBeenNthCalledWith(
						1, { ...expectedIssue, number: 1 }, optionsBase
					);
					expect( vi.mocked( isIssueOrPullRequestToStale ) ).toHaveBeenNthCalledWith(
						2, { ...expectedIssue, number: 2 }, optionsBase
					);
					expect( vi.mocked( isIssueOrPullRequestToStale ) ).toHaveBeenNthCalledWith(
						3, { ...expectedIssue, number: 3 }, optionsBase
					);

					expect( result ).toBeInstanceOf( Array );
					expect( result.length ).toEqual( 2 );
				} );

				it( 'should call on progress callback', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( vi.mocked( onProgress ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 1, { done: 1, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 2, { done: 2, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 3, { done: 3, total: 3 } );
				} );

				it( 'should count total hits only once using the value from first response', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo, entryIndex } ) => {
						return {
							search: {
								issueCount: issues.length - entryIndex,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress );

					expect( vi.mocked( onProgress ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 1, { done: 1, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 2, { done: 2, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 3, { done: 3, total: 3 } );
				} );

				it( 'should reject if request failed', () => {
					vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							return Promise.resolve();
						}
					);
				} );

				it( 'should reject if subsequent request failed', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ error: new Error( '500 Internal Server Error' ) }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							return Promise.resolve();
						}
					);
				} );

				it( 'should log an error if request failed', () => {
					const error = new Error( '500 Internal Server Error' );

					vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
							expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
								'Unexpected error when executing "#searchIssuesOrPullRequestsToStale()".', error
							);
						}
					);
				} );
			} );

			describe( '#searchStaleIssuesOrPullRequests()', () => {
				it( 'should be a function', () => {
					expect( githubRepository.searchStaleIssuesOrPullRequests ).toBeInstanceOf( Function );
				} );

				it( 'should ask for search query', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith( {
						searchDate: undefined,
						repositorySlug: 'ckeditor/ckeditor5',
						labels: [ 'status:stale' ]
					} );
				} );

				it( 'should not set the initial start date', async () => {
					const options = {
						...optionsBase,
						searchDate: undefined,
						staleDate: '2023-01-01'
					};

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: 0,
							nodes: [],
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( options, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith(
						expect.objectContaining( { 'searchDate': undefined } )
					);
				} );

				it( 'should return all stale issues if they are not paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					const result = await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( result ).toEqual( {
						issuesOrPullRequestsToClose: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						],
						issuesOrPullRequestsToUnstale: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						]
					} );
				} );

				it( 'should return all stale issues if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					const result = await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( result ).toEqual( {
						issuesOrPullRequestsToClose: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						],
						issuesOrPullRequestsToUnstale: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						]
					} );
				} );

				it( 'should send one request for all stale issues if they are not paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
						'query SearchIssuesOrPullRequests', { query: 'search query', cursor: null }
					);
				} );

				it( 'should send multiple requests for all stale issues if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 3 );

					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						1, 'query SearchIssuesOrPullRequests', { query: 'search query', cursor: null }
					);
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						2, 'query SearchIssuesOrPullRequests', { query: 'search query', cursor: 'cursor' }
					);
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						3, 'query SearchIssuesOrPullRequests', { query: 'search query', cursor: 'cursor' }
					);
				} );

				it( 'should fetch all timeline events for any issue if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1, timelineItems: {
							nodes: [],
							pageInfo: pageInfoWithNextPage
						} }
					];

					githubRepository.getIssueOrPullRequestTimelineItems = vi.fn().mockResolvedValue( [] );

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( vi.mocked( githubRepository.getIssueOrPullRequestTimelineItems ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( githubRepository.getIssueOrPullRequestTimelineItems ) ).toHaveBeenCalledWith(
						'IssueId', { hasNextPage: true, cursor: 'cursor' }
					);
				} );

				it( 'should ask for a new search query with new offset if GitHub prevents going to the next page', async () => {
					const issues = [
						{ ...issueBase, number: 1, createdAt: '2022-11-01T09:00:00Z' },
						{ ...issueBase, number: 2, createdAt: '2022-10-01T09:00:00Z' },
						{ ...issueBase, number: 3, createdAt: '2022-09-01T09:00:00Z' }
					];

					paginateRequest( issues, ( { nodes } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo: pageInfoNoNextPage
							}
						};
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 3 );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						1, expect.objectContaining( { searchDate: undefined } )
					);
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						2, expect.objectContaining( { searchDate: '2022-11-01T09:00:00Z' } )
					);
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						3, expect.objectContaining( { searchDate: '2022-10-01T09:00:00Z' } )
					);
				} );

				it( 'should return all stale issues if GitHub prevents going to the next page', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo: pageInfoNoNextPage
							}
						};
					} );

					const result = await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( result ).toEqual( {
						issuesOrPullRequestsToClose: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						],
						issuesOrPullRequestsToUnstale: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						]
					} );
				} );

				it( 'should check each issue if it should be unstaled or closed', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					vi.mocked( isIssueOrPullRequestToUnstale ).mockReturnValueOnce( false );
					vi.mocked( isIssueOrPullRequestToClose ).mockReturnValueOnce( false );

					const result = await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					const expectedIssue = {
						...issueBase,
						lastReactedAt: null,
						timelineItems: []
					};

					expect( vi.mocked( isIssueOrPullRequestToUnstale ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( isIssueOrPullRequestToUnstale ) ).toHaveBeenNthCalledWith(
						1, { ...expectedIssue, number: 1 }, optionsBase
					);
					expect( vi.mocked( isIssueOrPullRequestToUnstale ) ).toHaveBeenNthCalledWith(
						2, { ...expectedIssue, number: 2 }, optionsBase
					);
					expect( vi.mocked( isIssueOrPullRequestToUnstale ) ).toHaveBeenNthCalledWith(
						3, { ...expectedIssue, number: 3 }, optionsBase
					);

					expect( vi.mocked( isIssueOrPullRequestToClose ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( isIssueOrPullRequestToClose ) ).toHaveBeenNthCalledWith(
						1, { ...expectedIssue, number: 1 }, optionsBase
					);
					expect( vi.mocked( isIssueOrPullRequestToClose ) ).toHaveBeenNthCalledWith(
						2, { ...expectedIssue, number: 2 }, optionsBase
					);
					expect( vi.mocked( isIssueOrPullRequestToClose ) ).toHaveBeenNthCalledWith(
						3, { ...expectedIssue, number: 3 }, optionsBase
					);

					expect( result ).toEqual( {
						issuesOrPullRequestsToUnstale: [ expect.anything(), expect.anything() ],
						issuesOrPullRequestsToClose: [ expect.anything(), expect.anything() ]
					} );
				} );

				it( 'should call on progress callback', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( vi.mocked( onProgress ) ).toHaveBeenCalledTimes( 3 );

					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 1, { done: 1, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 2, { done: 2, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 3, { done: 3, total: 3 } );
				} );

				it( 'should count total hits only once using the value from first response', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo, entryIndex } ) => {
						return {
							search: {
								issueCount: issues.length - entryIndex,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress );

					expect( vi.mocked( onProgress ) ).toHaveBeenCalledTimes( 3 );

					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 1, { done: 1, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 2, { done: 2, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 3, { done: 3, total: 3 } );
				} );

				it( 'should reject if request failed', () => {
					vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							return Promise.resolve();
						}
					);
				} );

				it( 'should reject if subsequent request failed', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ error: new Error( '500 Internal Server Error' ) }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							return Promise.resolve();
						}
					);
				} );

				it( 'should log an error if request failed', () => {
					const error = new Error( '500 Internal Server Error' );

					vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
							expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
								'Unexpected error when executing "#searchStaleIssuesOrPullRequests()".', error
							);
						}
					);
				} );
			} );

			describe( '#searchPendingIssues()', () => {
				beforeEach( () => {
					issueBase.labels.nodes = [
						...optionsBase.pendingIssueLabels
					];
				} );

				it( 'should be a function', () => {
					expect( githubRepository.searchPendingIssues ).toBeInstanceOf( Function );
				} );

				it( 'should ask for search query', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					const options = {
						...optionsBase,
						ignoredIssueLabels: [ 'support:1', 'support:2', 'support:3' ]
					};

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchPendingIssues( options, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith( {
						type: 'Issue',
						searchDate: undefined,
						repositorySlug: 'ckeditor/ckeditor5',
						labels: [ 'pending:feedback' ],
						ignoredLabels: [ 'support:1', 'support:2', 'support:3' ]
					} );
				} );

				it( 'should not set the initial start date', async () => {
					const options = {
						...optionsBase,
						searchDate: undefined,
						staleDate: '2023-01-01'
					};

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: 0,
							nodes: [],
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchPendingIssues( options, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledWith(
						expect.objectContaining( { searchDate: undefined } )
					);
				} );

				it( 'should return all pending issues if they are not paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					const result = await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( result ).toEqual( {
						pendingIssuesToStale: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						],
						pendingIssuesToUnlabel: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						]
					} );
				} );

				it( 'should return all pending issues if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					const result = await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( result ).toEqual( {
						pendingIssuesToStale: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						],
						pendingIssuesToUnlabel: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						]
					} );
				} );

				it( 'should send one request for all pending issues if they are not paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
						'query SearchPendingIssues', { query: 'search query', cursor: null }
					);
				} );

				it( 'should send multiple requests for all pending issues if they are paginated', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						1, 'query SearchPendingIssues', { query: 'search query', cursor: null }
					);
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						2, 'query SearchPendingIssues', { query: 'search query', cursor: 'cursor' }
					);
					expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenNthCalledWith(
						3, 'query SearchPendingIssues', { query: 'search query', cursor: 'cursor' }
					);
				} );

				it( 'should ask for a new search query with new offset if GitHub prevents going to the next page', async () => {
					const issues = [
						{ ...issueBase, number: 1, createdAt: '2022-11-01T09:00:00Z' },
						{ ...issueBase, number: 2, createdAt: '2022-10-01T09:00:00Z' },
						{ ...issueBase, number: 3, createdAt: '2022-09-01T09:00:00Z' }
					];

					paginateRequest( issues, ( { nodes } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo: pageInfoNoNextPage
							}
						};
					} );

					await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						1, expect.objectContaining( { searchDate: undefined } )
					);
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						2, expect.objectContaining( { searchDate: '2022-11-01T09:00:00Z' } )
					);
					expect( vi.mocked( prepareSearchQuery ) ).toHaveBeenNthCalledWith(
						3, expect.objectContaining( { searchDate: '2022-10-01T09:00:00Z' } )
					);
				} );

				it( 'should return all pending issues if GitHub prevents going to the next page', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo: pageInfoNoNextPage
							}
						};
					} );

					const result = await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( result ).toEqual( {
						pendingIssuesToStale: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						],
						pendingIssuesToUnlabel: [
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' },
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						]
					} );
				} );

				it( 'should check each issue if it should be staled or unlabeled', async () => {
					const commentMember = {
						createdAt: '2022-11-30T23:59:59Z',
						authorAssociation: 'MEMBER'
					};

					const commentNonMember = {
						createdAt: '2022-11-30T23:59:59Z',
						authorAssociation: 'CONTRIBUTOR'
					};

					const issues = [
						{ ...issueBase, number: 1, comments: { nodes: [ commentMember ] } },
						{ ...issueBase, number: 2, comments: { nodes: [ commentMember ] } },
						{ ...issueBase, number: 3, comments: { nodes: [ commentNonMember ] } }
					];

					vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					vi.mocked( isPendingIssueToStale ).mockReturnValueOnce( false );
					vi.mocked( isPendingIssueToUnlabel ).mockReturnValueOnce( false );

					const result = await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( vi.mocked( isPendingIssueToStale ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( isPendingIssueToStale ) ).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining( {
							lastComment: { createdAt: '2022-11-30T23:59:59Z', isExternal: false }
						} ),
						optionsBase
					);
					expect( vi.mocked( isPendingIssueToStale ) ).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining( {
							lastComment: { createdAt: '2022-11-30T23:59:59Z', isExternal: false }
						} ),
						optionsBase
					);
					expect( vi.mocked( isPendingIssueToStale ) ).toHaveBeenNthCalledWith(
						3,
						expect.objectContaining( {
							lastComment: { createdAt: '2022-11-30T23:59:59Z', isExternal: true }
						} ),
						optionsBase
					);

					expect( vi.mocked( isPendingIssueToUnlabel ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( isPendingIssueToUnlabel ) ).toHaveBeenNthCalledWith(
						1,
						expect.objectContaining( {
							lastComment: { createdAt: '2022-11-30T23:59:59Z', isExternal: false }
						} )
					);
					expect( vi.mocked( isPendingIssueToUnlabel ) ).toHaveBeenNthCalledWith(
						2,
						expect.objectContaining( {
							lastComment: { createdAt: '2022-11-30T23:59:59Z', isExternal: false }
						} )
					);
					expect( vi.mocked( isPendingIssueToUnlabel ) ).toHaveBeenNthCalledWith(
						3,
						expect.objectContaining( {
							lastComment: { createdAt: '2022-11-30T23:59:59Z', isExternal: true }
						} )
					);

					expect( result ).toEqual( {
						pendingIssuesToStale: [ expect.anything(), expect.anything() ],
						pendingIssuesToUnlabel: [ expect.anything(), expect.anything() ]
					} );
				} );

				it( 'should call on progress callback', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( vi.mocked( onProgress ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 1, { done: 1, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 2, { done: 2, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 3, { done: 3, total: 3 } );
				} );

				it( 'should count total hits only once using the value from first response', async () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					paginateRequest( issues, ( { nodes, pageInfo, entryIndex } ) => {
						return {
							search: {
								issueCount: issues.length - entryIndex,
								nodes,
								pageInfo
							}
						};
					} );

					await githubRepository.searchPendingIssues( optionsBase, onProgress );

					expect( vi.mocked( onProgress ) ).toHaveBeenCalledTimes( 3 );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 1, { done: 1, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 2, { done: 2, total: 3 } );
					expect( vi.mocked( onProgress ) ).toHaveBeenNthCalledWith( 3, { done: 3, total: 3 } );
				} );

				it( 'should reject if request failed', () => {
					vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							return Promise.resolve();
						}
					);
				} );

				it( 'should reject if subsequent request failed', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ error: new Error( '500 Internal Server Error' ) }
					];

					paginateRequest( issues, ( { nodes, pageInfo } ) => {
						return {
							search: {
								issueCount: issues.length,
								nodes,
								pageInfo
							}
						};
					} );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							return Promise.resolve();
						}
					);
				} );

				it( 'should log an error if request failed', () => {
					const error = new Error( '500 Internal Server Error' );

					vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
							expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
								'Unexpected error when executing "#searchPendingIssues()".', error
							);
						}
					);
				} );
			} );
		} );

		describe( '#addComment()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.addComment ).toBeInstanceOf( Function );
			} );

			it( 'should add a comment', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue();

				await githubRepository.addComment( 'IssueId', 'A comment.' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'mutation AddComment', { nodeId: 'IssueId', comment: 'A comment.' }
				);
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.addComment( 'IssueId', 'A comment.' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.addComment( 'IssueId', 'A comment.' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#addComment()".', error
						);
					}
				);
			} );
		} );

		describe( '#getLabels()', () => {
			let labels;

			beforeEach( () => {
				labels = [
					{ id: 'LabelId1', name: 'type:bug' },
					{ id: 'LabelId2', name: 'type:task' },
					{ id: 'LabelId3', name: 'type:feature' }
				];
			} );

			it( 'should be a function', () => {
				expect( githubRepository.getLabels ).toBeInstanceOf( Function );
			} );

			it( 'should return an empty array if no labels are provided', async () => {
				const result = await githubRepository.getLabels( 'ckeditor/ckeditor5', [] );

				expect( result ).toEqual( [] );
			} );

			it( 'should return labels', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					repository: {
						labels: {
							nodes: labels
						}
					}
				} );

				const result = await githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] );

				expect( result ).toEqual( [
					'LabelId1', 'LabelId2', 'LabelId3'
				] );
			} );

			it( 'should return only requested labels even if GitHub endpoint returned additional ones', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					repository: {
						labels: {
							nodes: [
								...labels,
								{ id: 'LabelId4', name: 'type:docs' },
								{ id: 'LabelId5', name: 'type:debt' },
								{ id: 'LabelId6', name: 'type:question' },
								{ id: 'LabelId7', name: 'intro' }
							]
						}
					}
				} );

				const result = await githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] );

				expect( result ).toEqual( [
					'LabelId1', 'LabelId2', 'LabelId3'
				] );
			} );

			it( 'should send one request for labels', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( {
					repository: {
						labels: {
							nodes: labels
						}
					}
				} );

				await githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'query GetLabels',
					{ repositoryOwner: 'ckeditor', repositoryName: 'ckeditor5', labelNames: 'type:bug type:task type:feature' } );
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#getLabels()".', error
						);
					}
				);
			} );
		} );

		describe( '#addLabels()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.addLabels ).toBeInstanceOf( Function );
			} );

			it( 'should add a comment', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue();

				await githubRepository.addLabels( 'IssueId', [ 'LabelId' ] );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'mutation AddLabels', { nodeId: 'IssueId', labelIds: [ 'LabelId' ] }
				);
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.addLabels( 'IssueId', [ 'LabelId' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.addLabels( 'IssueId', [ 'LabelId' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#addLabels()".', error
						);
					}
				);
			} );
		} );

		describe( '#removeLabels()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.removeLabels ).toBeInstanceOf( Function );
			} );

			it( 'should add a comment', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue();

				await githubRepository.removeLabels( 'IssueId', [ 'LabelId' ] );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'mutation RemoveLabels', { nodeId: 'IssueId', labelIds: [ 'LabelId' ] }
				);
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.removeLabels( 'IssueId', [ 'LabelId' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.removeLabels( 'IssueId', [ 'LabelId' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#removeLabels()".', error
						);
					}
				);
			} );
		} );

		describe( '#closeIssueOrPullRequest()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.closeIssueOrPullRequest ).toBeInstanceOf( Function );
			} );

			it( 'should close issue', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue();

				await githubRepository.closeIssueOrPullRequest( 'Issue', 'IssueId' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'mutation CloseIssue', { nodeId: 'IssueId' }
				);
			} );

			it( 'should close pull request', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue();

				await githubRepository.closeIssueOrPullRequest( 'PullRequest', 'PullRequestId' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledWith(
					'mutation ClosePullRequest', { nodeId: 'PullRequestId' }
				);
			} );

			it( 'should reject if request failed', () => {
				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( new Error( '500 Internal Server Error' ) );

				return githubRepository.closeIssueOrPullRequest( 'Issue', 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						return Promise.resolve();
					}
				);
			} );

			it( 'should log an error if request failed', () => {
				const error = new Error( '500 Internal Server Error' );

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.closeIssueOrPullRequest( 'Issue', 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 1 );
						expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledWith(
							'Unexpected error when executing "#closeIssueOrPullRequest()".', error
						);
					}
				);
			} );
		} );

		describe( '#sendRequest()', () => {
			const payload = {
				data: {
					key: 'foo'
				}
			};

			beforeEach( () => {
				vi.useFakeTimers();
			} );

			afterEach( () => {
				vi.useRealTimers();
			} );

			it( 'should be a function', () => {
				expect( githubRepository.sendRequest ).toBeInstanceOf( Function );
			} );

			it( 'should resolve with the payload if no error occurred', async () => {
				vi.mocked( graphQLClientRequestMock ).mockResolvedValue( payload );

				const result = await githubRepository.sendRequest( 'query' );

				expect( result ).toEqual( payload );
			} );

			it( 'should reject with the error - no custom properties', () => {
				const error = new Error();

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( error );
					}
				);
			} );

			it( 'should reject with the error - custom "response" property', () => {
				const error = new Error();
				error.response = {};

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( error );
					}
				);
			} );

			it( 'should reject with the error - custom "response.errors" property', () => {
				const error = new Error();
				error.response = {
					errors: []
				};

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( error );
					}
				);
			} );

			it( 'should reject with the error - custom "response.errors" property with no API rate limit error', () => {
				const error = new Error();
				error.response = {
					errors: [
						{ type: 'INTERNAL_SERVER_ERROR' }
					]
				};

				vi.mocked( graphQLClientRequestMock ).mockRejectedValue( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( error );
					}
				);
			} );

			it( 'should re-send the request after API rate is reset - primary rate limit', async () => {
				const timeToWait = 28 * 60;
				const nowTimestamp = Math.floor( Date.now() / 1000 );
				const resetTimestamp = nowTimestamp + timeToWait;

				const error = new Error();
				error.response = {
					errors: [
						{ type: 'RATE_LIMITED' }
					],
					headers: new Map( [ [ 'x-ratelimit-reset', resetTimestamp ] ] )
				};

				vi.mocked( graphQLClientRequestMock ).mockRejectedValueOnce( error );
				vi.mocked( graphQLClientRequestMock ).mockResolvedValueOnce( payload );

				const sendPromise = githubRepository.sendRequest( 'query' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );

				await vi.advanceTimersByTimeAsync( timeToWait * 1000 );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 2 );

				return sendPromise;
			} );

			it( 'should re-send the request after API rate is reset - secondary rate limit', async () => {
				const timeToWait = 28 * 60;

				const error = new Error();
				error.response = {
					headers: new Map( [ [ 'retry-after', timeToWait ] ] )
				};

				vi.mocked( graphQLClientRequestMock ).mockRejectedValueOnce( error );
				vi.mocked( graphQLClientRequestMock ).mockResolvedValueOnce( payload );

				const sendPromise = githubRepository.sendRequest( 'query' );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 1 );

				await vi.advanceTimersByTimeAsync( timeToWait * 1000 );

				expect( vi.mocked( graphQLClientRequestMock ) ).toHaveBeenCalledTimes( 2 );

				await sendPromise;
			} );

			it( 'should log the progress and resolve with the payload after API rate is reset', async () => {
				const timeToWait = 28 * 60;
				const nowTimestamp = Math.floor( Date.now() / 1000 );
				const resetTimestamp = nowTimestamp + timeToWait;

				const error = new Error();
				error.response = {
					errors: [
						{ type: 'RATE_LIMITED' }
					],
					headers: new Map( [ [ 'x-ratelimit-reset', resetTimestamp ] ] )
				};

				vi.mocked( graphQLClientRequestMock ).mockRejectedValueOnce( error );
				vi.mocked( graphQLClientRequestMock ).mockResolvedValueOnce( payload );

				const sendPromise = githubRepository.sendRequest( 'query' );

				await vi.advanceTimersByTimeAsync( 0 );

				expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledTimes( 1 );
				expect( vi.mocked( loggerInfoMock ) ).toHaveBeenLastCalledWith(
					'⛔ The API limit is exceeded. Request is paused for 28 minutes.'
				);

				await vi.advanceTimersByTimeAsync( timeToWait * 1000 );

				expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledTimes( 2 );
				expect( vi.mocked( loggerInfoMock ) ).toHaveBeenLastCalledWith( '📍 Re-sending postponed request.' );

				const result = await sendPromise;
				expect( result ).toEqual( payload );
			} );
		} );

		function paginateRequest( dataToPaginate, paginator ) {
			for ( const entry of dataToPaginate ) {
				if ( entry.error ) {
					vi.mocked( graphQLClientRequestMock ).mockRejectedValueOnce( entry.error );
				}

				const entryIndex = dataToPaginate.indexOf( entry );
				const isLastEntry = entryIndex === dataToPaginate.length - 1;
				const pageInfo = isLastEntry ? pageInfoNoNextPage : pageInfoWithNextPage;

				const result = paginator( {
					nodes: [ entry ],
					pageInfo,
					entryIndex
				} );

				vi.mocked( graphQLClientRequestMock ).mockResolvedValueOnce( result );
			}
		}
	} );
} );
