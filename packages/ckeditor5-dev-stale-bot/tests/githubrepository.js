/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const upath = require( 'upath' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

const GRAPHQL_PATH = upath.join( __dirname, '..', 'lib', 'graphql' );

describe( 'lib/githubrepository', () => {
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
			}
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
			getissuetimelineitems: 'query GetIssueTimelineItems',
			getviewerlogin: 'query GetViewerLogin',
			searchissuestostale: 'query SearchIssuesToStale'
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
			}
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

	describe( '#getIssueTimelineItems()', () => {
		it( 'should be a function', () => {
			expect( githubRepository.getIssueTimelineItems ).to.be.a( 'function' );
		} );

		it( 'should return all timeline items if they are not paginated', () => {
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then( result => {
				expect( result ).to.be.an( 'array' );
				expect( result ).to.have.length( 3 );
				expect( result[ 0 ] ).to.deep.equal( { eventDate: '2022-12-01T09:00:00Z' } );
				expect( result[ 1 ] ).to.deep.equal( { eventDate: '2022-12-02T09:00:00Z' } );
				expect( result[ 2 ] ).to.deep.equal( { eventDate: '2022-12-03T09:00:00Z' } );
			} );
		} );

		it( 'should return all timeline items if they are paginated', () => {
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then( result => {
				expect( result ).to.be.an( 'array' );
				expect( result ).to.have.length( 3 );
				expect( result[ 0 ] ).to.deep.equal( { eventDate: '2022-12-01T09:00:00Z' } );
				expect( result[ 1 ] ).to.deep.equal( { eventDate: '2022-12-02T09:00:00Z' } );
				expect( result[ 2 ] ).to.deep.equal( { eventDate: '2022-12-03T09:00:00Z' } );
			} );
		} );

		it( 'should send one request for all timeline items if they are not paginated', () => {
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then( () => {
				expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					nodeId: 'GitHubNodeId',
					cursor: null
				} );
			} );
		} );

		it( 'should send multiple requests for all timeline items if they are paginated', () => {
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then( () => {
				expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					nodeId: 'GitHubNodeId',
					cursor: null
				} );

				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal( {
					nodeId: 'GitHubNodeId',
					cursor: 'cursor'
				} );

				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal( {
					nodeId: 'GitHubNodeId',
					cursor: 'cursor'
				} );
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then( result => {
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then(
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then(
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

			return githubRepository.getIssueTimelineItems( 'GitHubNodeId' ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				() => {
					expect( stubs.logger.error.callCount ).to.equal( 1 );
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
						'Unexpected error when executing "#getIssueTimelineItems()".'
					);
					expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
				}
			);
		} );
	} );

	describe( '#searchIssuesToStale()', () => {
		let options, onProgress, issueBase;

		beforeEach( () => {
			options = {
				type: 'issue',
				repositorySlug: 'ckeditor/ckeditor5',
				searchDate: '2022-12-01',
				staleDate: '2022-12-01',
				ignoredLabels: [],
				ignoredActivityLogins: [],
				ignoredActivityLabels: []
			};

			onProgress = sinon.stub();

			issueBase = {
				id: 'IssueId',
				number: 1,
				createdAt: '2022-12-01T09:00:00Z',
				lastEditedAt: null,
				reactions: {
					nodes: [],
					pageInfo: pageInfoNoNextPage
				},
				timelineItems: {
					nodes: [],
					pageInfo: pageInfoNoNextPage
				}
			};
		} );

		it( 'should be a function', () => {
			expect( githubRepository.searchIssuesToStale ).to.be.a( 'function' );
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( result => {
				expect( result ).to.be.an( 'array' );
				expect( result ).to.have.length( 3 );
				expect( result[ 0 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#1' } );
				expect( result[ 1 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#2' } );
				expect( result[ 2 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#3' } );
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( result => {
				expect( result ).to.be.an( 'array' );
				expect( result ).to.have.length( 3 );
				expect( result[ 0 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#1' } );
				expect( result[ 1 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#2' } );
				expect( result[ 2 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#3' } );
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( () => {
				expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc',
					cursor: null
				} );
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( () => {
				expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc',
					cursor: null
				} );

				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc',
					cursor: 'cursor'
				} );

				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc',
					cursor: 'cursor'
				} );
			} );
		} );

		it( 'should prepare search query with new offset if GitHub prevents going to the next page', () => {
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( () => {
				expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc',
					cursor: null
				} );

				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-11-01T09:00:00Z type:issue state:open sort:created-desc',
					cursor: null
				} );

				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal( {
					query: 'repo:ckeditor/ckeditor5 created:<2022-10-01T09:00:00Z type:issue state:open sort:created-desc',
					cursor: null
				} );
			} );
		} );

		it( 'should return all issues to stale if GitHub prevents going to the next page', () => {
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( result => {
				expect( result ).to.be.an( 'array' );
				expect( result ).to.have.length( 3 );
				expect( result[ 0 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#1' } );
				expect( result[ 1 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#2' } );
				expect( result[ 2 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#3' } );
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( () => {
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then( () => {
				expect( onProgress.callCount ).to.equal( 3 );

				expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
				expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
				expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
			} );
		} );

		it( 'should reject if request failed', () => {
			stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

			return githubRepository.searchIssuesToStale( options, onProgress ).then(
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then(
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

			return githubRepository.searchIssuesToStale( options, onProgress ).then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				() => {
					expect( stubs.logger.error.callCount ).to.equal( 1 );
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal(
						'Unexpected error when executing "#searchIssuesToStale()".'
					);
					expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
				}
			);
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
