/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const upath = require( 'upath' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

const GRAPHQL_PATH = upath.join( __dirname, '..', 'lib', 'graphql' );

describe( 'dev-stale-bot/lib', () => {
	describe( 'GitHubRepository', () => {
		let githubRepository, pageInfoNoNextPage, pageInfoWithNextPage, stubs, sandbox;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					readFile: sinon.stub()
				},
				logger: {
					error: sinon.stub(),
					info: sinon.stub()
				},
				GraphQLClient: {
					class: class {
						constructor( ...args ) {
							stubs.GraphQLClient.constructor( ...args );
						}

						request( ...args ) {
							return stubs.GraphQLClient.request( ...args );
						}
					},
					constructor: sinon.stub(),
					request: sinon.stub()
				},
				prepareSearchQuery: sinon.stub().returns( 'search query' ),
				isIssueOrPullRequestToStale: sinon.stub().returns( true ),
				isIssueOrPullRequestToUnstale: sinon.stub().returns( true ),
				isIssueOrPullRequestToClose: sinon.stub().returns( true ),
				isPendingIssueToStale: sinon.stub().returns( true ),
				isPendingIssueToUnlabel: sinon.stub().returns( true )
			};

			pageInfoWithNextPage = {
				hasNextPage: true,
				cursor: 'cursor'
			};

			pageInfoNoNextPage = {
				hasNextPage: false,
				cursor: 'cursor'
			};

			const queries = {
				getviewerlogin: 'query GetViewerLogin',
				searchissuesorpullrequests: 'query SearchIssuesOrPullRequests',
				searchpendingissues: 'query SearchPendingIssues',
				getissueorpullrequesttimelineitems: 'query GetIssueOrPullRequestTimelineItems',
				addcomment: 'mutation AddComment',
				getlabels: 'query GetLabels',
				addlabels: 'mutation AddLabels',
				removelabels: 'mutation RemoveLabels',
				closeissue: 'mutation CloseIssue',
				closepullrequest: 'mutation ClosePullRequest'
			};

			for ( const [ file, query ] of Object.entries( queries ) ) {
				const absolutePath = upath.join( GRAPHQL_PATH, `${ file }.graphql` );

				stubs.fs.readFile.withArgs( absolutePath, 'utf-8' ).resolves( query );
			}

			const GitHubRepository = proxyquire( '../lib/githubrepository', {
				'fs-extra': stubs.fs,
				'graphql-request': {
					GraphQLClient: stubs.GraphQLClient.class
				},
				'@ckeditor/ckeditor5-dev-utils': {
					logger() {
						return stubs.logger;
					}
				},
				'./utils/preparesearchquery': stubs.prepareSearchQuery,
				'./utils/isissueorpullrequesttostale': stubs.isIssueOrPullRequestToStale,
				'./utils/isissueorpullrequesttounstale': stubs.isIssueOrPullRequestToUnstale,
				'./utils/isissueorpullrequesttoclose': stubs.isIssueOrPullRequestToClose,
				'./utils/ispendingissuetostale': stubs.isPendingIssueToStale,
				'./utils/ispendingissuetounlabel': stubs.isPendingIssueToUnlabel
			} );

			githubRepository = new GitHubRepository( 'authorization-token' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( '#constructor()', () => {
			it( 'should create a new instance of GraphQLClient', () => {
				expect( stubs.GraphQLClient.constructor.callCount ).to.equal( 1 );
			} );

			it( 'should pass the API URL to the GraphQLClient instance', () => {
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 0 ] ).to.equal( 'https://api.github.com/graphql' );
			} );

			it( 'should pass the authorization token to the GraphQLClient instance', () => {
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ] ).to.have.property( 'headers' );
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ].headers ).to.have.property(
					'Authorization',
					'Bearer authorization-token'
				);
			} );

			it( 'should pass a proper "Accept" header to the GraphQLClient instance', () => {
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ] ).to.have.property( 'headers' );
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ].headers ).to.have.property(
					'Accept',
					'application/vnd.github.bane-preview+json'
				);
			} );

			it( 'should switch to the new global GitHub ID namespace in the GraphQLClient instance', () => {
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ] ).to.have.property( 'headers' );
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ].headers ).to.have.property( 'X-Github-Next-Global-ID', 1 );
			} );

			it( 'should disable the cache in the GraphQLClient instance', () => {
				expect( stubs.GraphQLClient.constructor.getCall( 0 ).args[ 1 ] ).to.have.property( 'cache', 'no-store' );
			} );
		} );

		describe( '#getViewerLogin()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.getViewerLogin ).to.be.a( 'function' );
			} );

			it( 'should return viewer login', () => {
				stubs.GraphQLClient.request.resolves( {
					viewer: {
						login: 'CKEditorBot'
					}
				} );

				return githubRepository.getViewerLogin().then( result => {
					expect( result ).to.equal( 'CKEditorBot' );
				} );
			} );

			it( 'should send one request for viewer login', () => {
				stubs.GraphQLClient.request.resolves( {
					viewer: {
						login: 'CKEditorBot'
					}
				} );

				return githubRepository.getViewerLogin().then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetViewerLogin' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {} );
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.getViewerLogin().then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
							'Unexpected error when executing "#getViewerLogin()".'
						);
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
					}
				);
			} );
		} );

		describe( '#getIssueOrPullRequestTimelineItems()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.getIssueOrPullRequestTimelineItems ).to.be.a( 'function' );
			} );

			it( 'should return all timeline events if they are not paginated', () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z' }
				];

				stubs.GraphQLClient.request.resolves( {
					node: {
						timelineItems: {
							nodes: timelineItems,
							pageInfo: pageInfoNoNextPage
						}
					}
				} );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then( result => {
					expect( result ).to.be.an( 'array' );
					expect( result ).to.have.length( 3 );
					expect( result[ 0 ] ).to.deep.equal( { eventDate: '2022-12-01T09:00:00Z' } );
					expect( result[ 1 ] ).to.deep.equal( { eventDate: '2022-12-02T09:00:00Z' } );
					expect( result[ 2 ] ).to.deep.equal( { eventDate: '2022-12-03T09:00:00Z' } );
				} );
			} );

			it( 'should return all timeline events if they are paginated', () => {
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

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then( result => {
					expect( result ).to.be.an( 'array' );
					expect( result ).to.have.length( 3 );
					expect( result[ 0 ] ).to.deep.equal( { eventDate: '2022-12-01T09:00:00Z' } );
					expect( result[ 1 ] ).to.deep.equal( { eventDate: '2022-12-02T09:00:00Z' } );
					expect( result[ 2 ] ).to.deep.equal( { eventDate: '2022-12-03T09:00:00Z' } );
				} );
			} );

			it( 'should send one request for all timeline events if they are not paginated', () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ createdAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z' }
				];

				stubs.GraphQLClient.request.resolves( {
					node: {
						timelineItems: {
							nodes: timelineItems,
							pageInfo: pageInfoNoNextPage
						}
					}
				} );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetIssueOrPullRequestTimelineItems' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId', cursor: null } );
				} );
			} );

			it( 'should send multiple requests for all timeline events if they are paginated', () => {
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

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then( () => {
					expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetIssueOrPullRequestTimelineItems' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId', cursor: null } );

					expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query GetIssueOrPullRequestTimelineItems' );
					expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId', cursor: 'cursor' } );

					expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query GetIssueOrPullRequestTimelineItems' );
					expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId', cursor: 'cursor' } );
				} );
			} );

			it( 'should return event date, event author and label if any of these exist', () => {
				const timelineItems = [
					{ createdAt: '2022-12-01T09:00:00Z' },
					{ updatedAt: '2022-12-02T09:00:00Z' },
					{ createdAt: '2022-12-03T09:00:00Z', actor: { login: 'RandomUser' } },
					{ createdAt: '2022-12-04T09:00:00Z', author: { login: 'RandomUser' } },
					{ createdAt: '2022-12-05T09:00:00Z', label: { name: 'type:bug' } }
				];

				stubs.GraphQLClient.request.resolves( {
					node: {
						timelineItems: {
							nodes: timelineItems,
							pageInfo: pageInfoNoNextPage
						}
					}
				} );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then( result => {
					expect( result ).to.be.an( 'array' );
					expect( result ).to.have.length( 5 );
					expect( result[ 0 ] ).to.deep.equal( { eventDate: '2022-12-01T09:00:00Z' } );
					expect( result[ 1 ] ).to.deep.equal( { eventDate: '2022-12-02T09:00:00Z' } );
					expect( result[ 2 ] ).to.deep.equal( { eventDate: '2022-12-03T09:00:00Z', author: 'RandomUser' } );
					expect( result[ 3 ] ).to.deep.equal( { eventDate: '2022-12-04T09:00:00Z', author: 'RandomUser' } );
					expect( result[ 4 ] ).to.deep.equal( { eventDate: '2022-12-05T09:00:00Z', label: 'type:bug' } );
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.onCall( 2 ).rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.getIssueOrPullRequestTimelineItems( 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
							'Unexpected error when executing "#getIssueOrPullRequestTimelineItems()".'
						);
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
					}
				);
			} );
		} );

		describe( 'searching', () => {
			let onProgress, optionsBase, issueBase;

			beforeEach( () => {
				onProgress = sinon.stub();

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
					expect( githubRepository.searchIssuesOrPullRequestsToStale ).to.be.a( 'function' );
				} );

				it( 'should ask for issue search query', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					const options = {
						...optionsBase,
						ignoredIssueLabels: [ 'support:1', 'support:2', 'support:3' ]
					};

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', options, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
							type: 'Issue',
							searchDate: '2022-12-01',
							repositorySlug: 'ckeditor/ckeditor5',
							ignoredLabels: [ 'status:stale', 'support:1', 'support:2', 'support:3' ]
						} );
					} );
				} );

				it( 'should ask for pull request search query', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					const options = {
						...optionsBase,
						ignoredPullRequestLabels: [ 'support:1', 'support:2', 'support:3' ]
					};

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'PullRequest', options, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
							type: 'PullRequest',
							searchDate: '2022-12-01',
							repositorySlug: 'ckeditor/ckeditor5',
							ignoredLabels: [ 'status:stale', 'support:1', 'support:2', 'support:3' ]
						} );
					} );
				} );

				it( 'should start the search from stale date if search date is not set', () => {
					const options = {
						...optionsBase,
						searchDate: undefined,
						staleDate: '2023-01-01'
					};

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: 0,
							nodes: [],
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', options, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.have.property( 'searchDate', '2023-01-01' );
					} );
				} );

				it( 'should return all issues to stale if they are not paginated', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( result => {
						expect( result ).to.be.an( 'array' );
						expect( result ).to.have.length( 3 );
						expect( result[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
						expect( result[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
						expect( result[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should return all issues to stale if they are paginated', () => {
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

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( result => {
						expect( result ).to.be.an( 'array' );
						expect( result ).to.have.length( 3 );
						expect( result[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
						expect( result[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
						expect( result[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should send one request for all issues to stale if they are not paginated', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( () => {
						expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: null }
						);
					} );
				} );

				it( 'should send multiple requests for all issues to stale if they are paginated', () => {
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

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( () => {
						expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: null }
						);

						expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: 'cursor' }
						);

						expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: 'cursor' }
						);
					} );
				} );

				it( 'should fetch all timeline events for any issue if they are paginated', () => {
					const issues = [
						{ ...issueBase, number: 1, timelineItems: {
							nodes: [],
							pageInfo: pageInfoWithNextPage
						} }
					];

					sinon.stub( githubRepository, 'getIssueOrPullRequestTimelineItems' ).resolves( [] );

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( () => {
						expect( githubRepository.getIssueOrPullRequestTimelineItems.callCount ).to.equal( 1 );

						expect( githubRepository.getIssueOrPullRequestTimelineItems.getCall( 0 ).args[ 0 ] ).to.equal( 'IssueId' );
						expect( githubRepository.getIssueOrPullRequestTimelineItems.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
							hasNextPage: true,
							cursor: 'cursor'
						} );
					} );
				} );

				it( 'should ask for a new search query with new offset if GitHub prevents going to the next page', () => {
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

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.callCount ).to.equal( 3 );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-12-01' );
						expect( stubs.prepareSearchQuery.getCall( 1 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-11-01T09:00:00Z' );
						expect( stubs.prepareSearchQuery.getCall( 2 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-10-01T09:00:00Z' );
					} );
				} );

				it( 'should return all issues to stale if GitHub prevents going to the next page', () => {
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

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( result => {
						expect( result ).to.be.an( 'array' );
						expect( result ).to.have.length( 3 );
						expect( result[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
						expect( result[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
						expect( result[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', title: 'IssueTitle', type: 'Issue', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should check each issue if it is stale', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					stubs.isIssueOrPullRequestToStale.onCall( 1 ).returns( false );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( result => {
						const expectedIssue = {
							...issueBase,
							lastReactedAt: null,
							timelineItems: []
						};

						expect( stubs.isIssueOrPullRequestToStale.callCount ).to.equal( 3 );

						expect( stubs.isIssueOrPullRequestToStale.getCall( 0 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 1 } );
						expect( stubs.isIssueOrPullRequestToStale.getCall( 0 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToStale.getCall( 1 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 2 } );
						expect( stubs.isIssueOrPullRequestToStale.getCall( 1 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToStale.getCall( 2 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 3 } );
						expect( stubs.isIssueOrPullRequestToStale.getCall( 2 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( result ).to.be.an( 'array' );
						expect( result ).to.have.length( 2 );
					} );
				} );

				it( 'should call on progress callback', () => {
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

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( () => {
						expect( onProgress.callCount ).to.equal( 3 );

						expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
						expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
						expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
					} );
				} );

				it( 'should count total hits only once using the value from first response', () => {
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

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then( () => {
						expect( onProgress.callCount ).to.equal( 3 );

						expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
						expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
						expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
					} );
				} );

				it( 'should reject if request failed', () => {
					stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

					stubs.GraphQLClient.request.onCall( 2 ).rejects( new Error( '500 Internal Server Error' ) );

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

					stubs.GraphQLClient.request.rejects( error );

					return githubRepository.searchIssuesOrPullRequestsToStale( 'Issue', optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( stubs.logger.error.callCount ).to.equal( 1 );
							expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
								'Unexpected error when executing "#searchIssuesOrPullRequestsToStale()".'
							);
							expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
						}
					);
				} );
			} );

			describe( '#searchStaleIssuesOrPullRequests()', () => {
				it( 'should be a function', () => {
					expect( githubRepository.searchStaleIssuesOrPullRequests ).to.be.a( 'function' );
				} );

				it( 'should ask for search query', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
							searchDate: undefined,
							repositorySlug: 'ckeditor/ckeditor5',
							labels: [ 'status:stale' ]
						} );
					} );
				} );

				it( 'should not set the initial start date', () => {
					const options = {
						...optionsBase,
						searchDate: undefined,
						staleDate: '2023-01-01'
					};

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: 0,
							nodes: [],
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchStaleIssuesOrPullRequests( options, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.have.property( 'searchDate', undefined );
					} );
				} );

				it( 'should return all stale issues if they are not paginated', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( result => {
						expect( result ).to.have.property( 'issuesOrPullRequestsToClose' );
						expect( result ).to.have.property( 'issuesOrPullRequestsToUnstale' );

						expect( result.issuesOrPullRequestsToClose ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToClose ).to.have.length( 3 );
						expect( result.issuesOrPullRequestsToClose[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToClose[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToClose[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);

						expect( result.issuesOrPullRequestsToUnstale ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToUnstale ).to.have.length( 3 );
						expect( result.issuesOrPullRequestsToUnstale[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToUnstale[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToUnstale[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should return all stale issues if they are paginated', () => {
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

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( result => {
						expect( result ).to.have.property( 'issuesOrPullRequestsToClose' );
						expect( result ).to.have.property( 'issuesOrPullRequestsToUnstale' );

						expect( result.issuesOrPullRequestsToClose ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToClose ).to.have.length( 3 );
						expect( result.issuesOrPullRequestsToClose[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToClose[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToClose[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);

						expect( result.issuesOrPullRequestsToUnstale ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToUnstale ).to.have.length( 3 );
						expect( result.issuesOrPullRequestsToUnstale[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToUnstale[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToUnstale[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should send one request for all stale issues if they are not paginated', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: null }
						);
					} );
				} );

				it( 'should send multiple requests for all stale issues if they are paginated', () => {
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

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: null }
						);

						expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: 'cursor' }
						);

						expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query SearchIssuesOrPullRequests' );
						expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: 'cursor' }
						);
					} );
				} );

				it( 'should fetch all timeline events for any issue if they are paginated', () => {
					const issues = [
						{ ...issueBase, number: 1, timelineItems: {
							nodes: [],
							pageInfo: pageInfoWithNextPage
						} }
					];

					sinon.stub( githubRepository, 'getIssueOrPullRequestTimelineItems' ).resolves( [] );

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( githubRepository.getIssueOrPullRequestTimelineItems.callCount ).to.equal( 1 );

						expect( githubRepository.getIssueOrPullRequestTimelineItems.getCall( 0 ).args[ 0 ] ).to.equal( 'IssueId' );
						expect( githubRepository.getIssueOrPullRequestTimelineItems.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
							hasNextPage: true,
							cursor: 'cursor'
						} );
					} );
				} );

				it( 'should ask for a new search query with new offset if GitHub prevents going to the next page', () => {
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

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.callCount ).to.equal( 3 );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.have.property( 'searchDate', undefined );
						expect( stubs.prepareSearchQuery.getCall( 1 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-11-01T09:00:00Z' );
						expect( stubs.prepareSearchQuery.getCall( 2 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-10-01T09:00:00Z' );
					} );
				} );

				it( 'should return all stale issues if GitHub prevents going to the next page', () => {
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

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( result => {
						expect( result ).to.have.property( 'issuesOrPullRequestsToClose' );
						expect( result ).to.have.property( 'issuesOrPullRequestsToUnstale' );

						expect( result.issuesOrPullRequestsToClose ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToClose ).to.have.length( 3 );
						expect( result.issuesOrPullRequestsToClose[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToClose[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToClose[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);

						expect( result.issuesOrPullRequestsToUnstale ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToUnstale ).to.have.length( 3 );
						expect( result.issuesOrPullRequestsToUnstale[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToUnstale[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.issuesOrPullRequestsToUnstale[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should check each issue if it should be unstaled or closed', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					stubs.isIssueOrPullRequestToUnstale.onCall( 1 ).returns( false );
					stubs.isIssueOrPullRequestToClose.onCall( 1 ).returns( false );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( result => {
						const expectedIssue = {
							...issueBase,
							lastReactedAt: null,
							timelineItems: []
						};

						expect( stubs.isIssueOrPullRequestToUnstale.callCount ).to.equal( 3 );

						expect( stubs.isIssueOrPullRequestToUnstale.getCall( 0 ).args[ 0 ] ).to.deep.equal(
							{ ...expectedIssue, number: 1 }
						);
						expect( stubs.isIssueOrPullRequestToUnstale.getCall( 0 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToUnstale.getCall( 1 ).args[ 0 ] ).to.deep.equal(
							{ ...expectedIssue, number: 2 }
						);
						expect( stubs.isIssueOrPullRequestToUnstale.getCall( 1 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToUnstale.getCall( 2 ).args[ 0 ] ).to.deep.equal(
							{ ...expectedIssue, number: 3 }
						);
						expect( stubs.isIssueOrPullRequestToUnstale.getCall( 2 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToClose.callCount ).to.equal( 3 );

						expect( stubs.isIssueOrPullRequestToClose.getCall( 0 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 1 } );
						expect( stubs.isIssueOrPullRequestToClose.getCall( 0 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToClose.getCall( 1 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 2 } );
						expect( stubs.isIssueOrPullRequestToClose.getCall( 1 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isIssueOrPullRequestToClose.getCall( 2 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 3 } );
						expect( stubs.isIssueOrPullRequestToClose.getCall( 2 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( result.issuesOrPullRequestsToUnstale ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToUnstale ).to.have.length( 2 );
						expect( result.issuesOrPullRequestsToClose ).to.be.an( 'array' );
						expect( result.issuesOrPullRequestsToClose ).to.have.length( 2 );
					} );
				} );

				it( 'should call on progress callback', () => {
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

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( onProgress.callCount ).to.equal( 3 );

						expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
						expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
						expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
					} );
				} );

				it( 'should count total hits only once using the value from first response', () => {
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

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then( () => {
						expect( onProgress.callCount ).to.equal( 3 );

						expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
						expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
						expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
					} );
				} );

				it( 'should reject if request failed', () => {
					stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

					stubs.GraphQLClient.request.onCall( 2 ).rejects( new Error( '500 Internal Server Error' ) );

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

					stubs.GraphQLClient.request.rejects( error );

					return githubRepository.searchStaleIssuesOrPullRequests( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( stubs.logger.error.callCount ).to.equal( 1 );
							expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
								'Unexpected error when executing "#searchStaleIssuesOrPullRequests()".'
							);
							expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
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
					expect( githubRepository.searchPendingIssues ).to.be.a( 'function' );
				} );

				it( 'should ask for search query', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					const options = {
						...optionsBase,
						ignoredIssueLabels: [ 'support:1', 'support:2', 'support:3' ]
					};

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchPendingIssues( options, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
							type: 'Issue',
							searchDate: undefined,
							repositorySlug: 'ckeditor/ckeditor5',
							labels: [ 'pending:feedback' ],
							ignoredLabels: [ 'support:1', 'support:2', 'support:3' ]
						} );
					} );
				} );

				it( 'should not set the initial start date', () => {
					const options = {
						...optionsBase,
						searchDate: undefined,
						staleDate: '2023-01-01'
					};

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: 0,
							nodes: [],
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchPendingIssues( options, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.have.property( 'searchDate', undefined );
					} );
				} );

				it( 'should return all pending issues if they are not paginated', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( result => {
						expect( result ).to.have.property( 'pendingIssuesToStale' );
						expect( result ).to.have.property( 'pendingIssuesToUnlabel' );

						expect( result.pendingIssuesToStale ).to.be.an( 'array' );
						expect( result.pendingIssuesToStale ).to.have.length( 3 );
						expect( result.pendingIssuesToStale[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToStale[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToStale[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);

						expect( result.pendingIssuesToUnlabel ).to.be.an( 'array' );
						expect( result.pendingIssuesToUnlabel ).to.have.length( 3 );
						expect( result.pendingIssuesToUnlabel[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToUnlabel[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToUnlabel[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should return all pending issues if they are paginated', () => {
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

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( result => {
						expect( result ).to.have.property( 'pendingIssuesToStale' );
						expect( result ).to.have.property( 'pendingIssuesToUnlabel' );

						expect( result.pendingIssuesToStale ).to.be.an( 'array' );
						expect( result.pendingIssuesToStale ).to.have.length( 3 );
						expect( result.pendingIssuesToStale[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToStale[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToStale[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);

						expect( result.pendingIssuesToUnlabel ).to.be.an( 'array' );
						expect( result.pendingIssuesToUnlabel ).to.have.length( 3 );
						expect( result.pendingIssuesToUnlabel[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToUnlabel[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToUnlabel[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should send one request for all pending issues if they are not paginated', () => {
					const issues = [
						{ ...issueBase, number: 1 },
						{ ...issueBase, number: 2 },
						{ ...issueBase, number: 3 }
					];

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( () => {
						expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchPendingIssues' );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: null }
						);
					} );
				} );

				it( 'should send multiple requests for all pending issues if they are paginated', () => {
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

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( () => {
						expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchPendingIssues' );
						expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: null }
						);

						expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query SearchPendingIssues' );
						expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: 'cursor' }
						);

						expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query SearchPendingIssues' );
						expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal(
							{ query: 'search query', cursor: 'cursor' }
						);
					} );
				} );

				it( 'should ask for a new search query with new offset if GitHub prevents going to the next page', () => {
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

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( () => {
						expect( stubs.prepareSearchQuery.callCount ).to.equal( 3 );
						expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.have.property( 'searchDate', undefined );
						expect( stubs.prepareSearchQuery.getCall( 1 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-11-01T09:00:00Z' );
						expect( stubs.prepareSearchQuery.getCall( 2 ).args[ 0 ] ).to.have.property( 'searchDate', '2022-10-01T09:00:00Z' );
					} );
				} );

				it( 'should return all pending issues if GitHub prevents going to the next page', () => {
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

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( result => {
						expect( result ).to.have.property( 'pendingIssuesToStale' );
						expect( result ).to.have.property( 'pendingIssuesToUnlabel' );

						expect( result.pendingIssuesToStale ).to.be.an( 'array' );
						expect( result.pendingIssuesToStale ).to.have.length( 3 );
						expect( result.pendingIssuesToStale[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToStale[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToStale[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);

						expect( result.pendingIssuesToUnlabel ).to.be.an( 'array' );
						expect( result.pendingIssuesToUnlabel ).to.have.length( 3 );
						expect( result.pendingIssuesToUnlabel[ 0 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToUnlabel[ 1 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
						expect( result.pendingIssuesToUnlabel[ 2 ] ).to.deep.equal(
							{ id: 'IssueId', type: 'Issue', title: 'IssueTitle', url: 'https://github.com/' }
						);
					} );
				} );

				it( 'should check each issue if it should be staled or unlabeled', () => {
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

					stubs.GraphQLClient.request.resolves( {
						search: {
							issueCount: issues.length,
							nodes: issues,
							pageInfo: pageInfoNoNextPage
						}
					} );

					stubs.isPendingIssueToStale.onCall( 1 ).returns( false );
					stubs.isPendingIssueToUnlabel.onCall( 1 ).returns( false );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( result => {
						expect( stubs.isPendingIssueToStale.callCount ).to.equal( 3 );

						expect( stubs.isPendingIssueToStale.getCall( 0 ).args[ 0 ] ).to.have.deep.property( 'lastComment', {
							createdAt: '2022-11-30T23:59:59Z', isExternal: false
						} );
						expect( stubs.isPendingIssueToStale.getCall( 0 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isPendingIssueToStale.getCall( 1 ).args[ 0 ] ).to.have.deep.property( 'lastComment', {
							createdAt: '2022-11-30T23:59:59Z', isExternal: false
						} );
						expect( stubs.isPendingIssueToStale.getCall( 1 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isPendingIssueToStale.getCall( 2 ).args[ 0 ] ).to.have.deep.property( 'lastComment', {
							createdAt: '2022-11-30T23:59:59Z', isExternal: true
						} );
						expect( stubs.isPendingIssueToStale.getCall( 2 ).args[ 1 ] ).to.deep.equal( optionsBase );

						expect( stubs.isPendingIssueToUnlabel.callCount ).to.equal( 3 );

						expect( stubs.isPendingIssueToUnlabel.getCall( 0 ).args[ 0 ] ).to.have.deep.property( 'lastComment', {
							createdAt: '2022-11-30T23:59:59Z', isExternal: false
						} );
						expect( stubs.isPendingIssueToUnlabel.getCall( 1 ).args[ 0 ] ).to.have.deep.property( 'lastComment', {
							createdAt: '2022-11-30T23:59:59Z', isExternal: false
						} );
						expect( stubs.isPendingIssueToUnlabel.getCall( 2 ).args[ 0 ] ).to.have.deep.property( 'lastComment', {
							createdAt: '2022-11-30T23:59:59Z', isExternal: true
						} );

						expect( result.pendingIssuesToStale ).to.be.an( 'array' );
						expect( result.pendingIssuesToStale ).to.have.length( 2 );
						expect( result.pendingIssuesToUnlabel ).to.be.an( 'array' );
						expect( result.pendingIssuesToUnlabel ).to.have.length( 2 );
					} );
				} );

				it( 'should call on progress callback', () => {
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

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( () => {
						expect( onProgress.callCount ).to.equal( 3 );

						expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
						expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
						expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
					} );
				} );

				it( 'should count total hits only once using the value from first response', () => {
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

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then( () => {
						expect( onProgress.callCount ).to.equal( 3 );

						expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
						expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
						expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
					} );
				} );

				it( 'should reject if request failed', () => {
					stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

					stubs.GraphQLClient.request.onCall( 2 ).rejects( new Error( '500 Internal Server Error' ) );

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

					stubs.GraphQLClient.request.rejects( error );

					return githubRepository.searchPendingIssues( optionsBase, onProgress ).then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						() => {
							expect( stubs.logger.error.callCount ).to.equal( 1 );
							expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
								'Unexpected error when executing "#searchPendingIssues()".'
							);
							expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
						}
					);
				} );
			} );
		} );

		describe( '#addComment()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.addComment ).to.be.a( 'function' );
			} );

			it( 'should add a comment', () => {
				stubs.GraphQLClient.request.resolves();

				return githubRepository.addComment( 'IssueId', 'A comment.' ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'mutation AddComment' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal(
						{ nodeId: 'IssueId', comment: 'A comment.' }
					);
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.addComment( 'IssueId', 'A comment.' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Unexpected error when executing "#addComment()".' );
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
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
				expect( githubRepository.getLabels ).to.be.a( 'function' );
			} );

			it( 'should return an empty array if no labels are provided', () => {
				return githubRepository.getLabels( 'ckeditor/ckeditor5', [] ).then( result => {
					expect( result ).to.be.an( 'array' );
					expect( result ).to.have.length( 0 );
				} );
			} );

			it( 'should return labels', () => {
				stubs.GraphQLClient.request.resolves( {
					repository: {
						labels: {
							nodes: labels
						}
					}
				} );

				return githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] ).then( result => {
					expect( result ).to.be.an( 'array' );
					expect( result ).to.have.length( 3 );
					expect( result[ 0 ] ).to.equal( 'LabelId1' );
					expect( result[ 1 ] ).to.equal( 'LabelId2' );
					expect( result[ 2 ] ).to.equal( 'LabelId3' );
				} );
			} );

			it( 'should return only requested labels even if GitHub endpoint returned additional ones', () => {
				stubs.GraphQLClient.request.resolves( {
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

				return githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] ).then( result => {
					expect( result ).to.be.an( 'array' );
					expect( result ).to.have.length( 3 );
					expect( result[ 0 ] ).to.equal( 'LabelId1' );
					expect( result[ 1 ] ).to.equal( 'LabelId2' );
					expect( result[ 2 ] ).to.equal( 'LabelId3' );
				} );
			} );

			it( 'should send one request for labels', () => {
				stubs.GraphQLClient.request.resolves( {
					repository: {
						labels: {
							nodes: labels
						}
					}
				} );

				return githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetLabels' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
						repositoryOwner: 'ckeditor',
						repositoryName: 'ckeditor5',
						labelNames: 'type:bug type:task type:feature'
					} );
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.getLabels( 'ckeditor/ckeditor5', [ 'type:bug', 'type:task', 'type:feature' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Unexpected error when executing "#getLabels()".' );
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
					}
				);
			} );
		} );

		describe( '#addLabels()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.addLabels ).to.be.a( 'function' );
			} );

			it( 'should add a comment', () => {
				stubs.GraphQLClient.request.resolves();

				return githubRepository.addLabels( 'IssueId', [ 'LabelId' ] ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'mutation AddLabels' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
						nodeId: 'IssueId',
						labelIds: [ 'LabelId' ]
					} );
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.addLabels( 'IssueId', [ 'LabelId' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Unexpected error when executing "#addLabels()".' );
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
					}
				);
			} );
		} );

		describe( '#removeLabels()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.removeLabels ).to.be.a( 'function' );
			} );

			it( 'should add a comment', () => {
				stubs.GraphQLClient.request.resolves();

				return githubRepository.removeLabels( 'IssueId', [ 'LabelId' ] ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'mutation RemoveLabels' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
						nodeId: 'IssueId',
						labelIds: [ 'LabelId' ]
					} );
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.removeLabels( 'IssueId', [ 'LabelId' ] ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
							'Unexpected error when executing "#removeLabels()".'
						);
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
					}
				);
			} );
		} );

		describe( '#closeIssueOrPullRequest()', () => {
			it( 'should be a function', () => {
				expect( githubRepository.closeIssueOrPullRequest ).to.be.a( 'function' );
			} );

			it( 'should close issue', () => {
				stubs.GraphQLClient.request.resolves();

				return githubRepository.closeIssueOrPullRequest( 'Issue', 'IssueId' ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'mutation CloseIssue' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId' } );
				} );
			} );

			it( 'should close pull request', () => {
				stubs.GraphQLClient.request.resolves();

				return githubRepository.closeIssueOrPullRequest( 'PullRequest', 'PullRequestId' ).then( () => {
					expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'mutation ClosePullRequest' );
					expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { nodeId: 'PullRequestId' } );
				} );
			} );

			it( 'should reject if request failed', () => {
				stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.closeIssueOrPullRequest( 'Issue', 'IssueId' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.logger.error.callCount ).to.equal( 1 );
						expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
							'Unexpected error when executing "#closeIssueOrPullRequest()".'
						);
						expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
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

			let clock;

			beforeEach( () => {
				clock = sinon.useFakeTimers();
			} );

			afterEach( () => {
				clock.restore();
			} );

			it( 'should be a function', () => {
				expect( githubRepository.sendRequest ).to.be.a( 'function' );
			} );

			it( 'should resolve with the payload if no error occurred', () => {
				stubs.GraphQLClient.request.resolves( payload );

				return githubRepository.sendRequest( 'query' ).then( result => {
					expect( result ).to.equal( payload );
				} );
			} );

			it( 'should reject with the error - no custom properties', () => {
				const error = new Error();

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);
			} );

			it( 'should reject with the error - custom "response" property', () => {
				const error = new Error();
				error.response = {};

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);
			} );

			it( 'should reject with the error - custom "response.errors" property', () => {
				const error = new Error();
				error.response = {
					errors: []
				};

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
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

				stubs.GraphQLClient.request.rejects( error );

				return githubRepository.sendRequest( 'query' ).then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( error );
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

				stubs.GraphQLClient.request.onCall( 0 ).rejects( error ).onCall( 1 ).resolves( payload );

				const sendPromise = githubRepository.sendRequest( 'query' );

				expect( stubs.GraphQLClient.request.callCount ).to.equal( 1 );

				await clock.tickAsync( timeToWait * 1000 );

				expect( stubs.GraphQLClient.request.callCount ).to.equal( 2 );

				return sendPromise;
			} );

			it( 'should re-send the request after API rate is reset - secondary rate limit', async () => {
				const timeToWait = 28 * 60;

				const error = new Error();
				error.response = {
					headers: new Map( [ [ 'retry-after', timeToWait ] ] )
				};

				stubs.GraphQLClient.request.onCall( 0 ).rejects( error ).onCall( 1 ).resolves( payload );

				const sendPromise = githubRepository.sendRequest( 'query' );

				expect( stubs.GraphQLClient.request.callCount ).to.equal( 1 );

				await clock.tickAsync( timeToWait * 1000 );

				expect( stubs.GraphQLClient.request.callCount ).to.equal( 2 );

				return sendPromise;
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

				stubs.GraphQLClient.request.onCall( 0 ).rejects( error ).onCall( 1 ).resolves( payload );

				const sendPromise = githubRepository.sendRequest( 'query' );

				await clock.tickAsync( 0 );

				expect( stubs.logger.info.callCount ).to.equal( 1 );
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal(
					'⛔ The API limit is exceeded. Request is paused for 28 minutes.'
				);

				await clock.tickAsync( timeToWait * 1000 );

				expect( stubs.logger.info.callCount ).to.equal( 2 );
				expect( stubs.logger.info.getCall( 1 ).args[ 0 ] ).to.equal( '📍 Re-sending postponed request.' );

				return sendPromise.then( result => {
					expect( result ).to.equal( payload );
				} );
			} );
		} );

		function paginateRequest( dataToPaginate, paginator ) {
			for ( const entry of dataToPaginate ) {
				const entryIndex = dataToPaginate.indexOf( entry );
				const isLastEntry = entryIndex === dataToPaginate.length - 1;
				const pageInfo = isLastEntry ? pageInfoNoNextPage : pageInfoWithNextPage;

				const result = paginator( {
					nodes: [ entry ],
					pageInfo,
					entryIndex
				} );

				stubs.GraphQLClient.request.onCall( entryIndex ).resolves( result );
			}
		}
	} );
} );
