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
			},
			prepareSearchQuery: sinon.stub().returns( 'search query' ),
			isIssueStale: sinon.stub().returns( true )
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
			},
			'./utils/preparesearchquery': stubs.prepareSearchQuery,
			'./utils/isissuestale': stubs.isIssueStale
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
					expect( stubs.logger.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Unexpected error when executing "#getViewerLogin()".' );
					expect( stubs.logger.error.getCall( 0 ).args[ 1 ] ).to.equal( error );
				}
			);
		} );
	} );

	describe( '#getIssueTimelineItems()', () => {
		it( 'should be a function', () => {
			expect( githubRepository.getIssueTimelineItems ).to.be.a( 'function' );
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then( result => {
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then( result => {
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then( () => {
				expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then( () => {
				expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId', cursor: null } );

				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal( { nodeId: 'IssueId', cursor: 'cursor' } );

				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query GetIssueTimelineItems' );
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then( result => {
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then(
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then(
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

			return githubRepository.getIssueTimelineItems( 'IssueId' ).then(
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
		let onProgress, optionsBase, issueBase;

		beforeEach( () => {
			onProgress = sinon.stub();

			optionsBase = {
				type: 'issue',
				repositorySlug: 'ckeditor/ckeditor5',
				searchDate: '2022-12-01',
				staleDate: '2022-12-01',
				ignoredLabels: [],
				ignoredActivityLogins: [],
				ignoredActivityLabels: []
			};

			issueBase = {
				id: 'IssueId',
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
				}
			};
		} );

		it( 'should be a function', () => {
			expect( githubRepository.searchIssuesToStale ).to.be.a( 'function' );
		} );

		it( 'should ask for a search query', () => {
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
				expect( stubs.prepareSearchQuery.calledOnce ).to.equal( true );
				expect( stubs.prepareSearchQuery.getCall( 0 ).args[ 0 ] ).to.deep.equal( optionsBase );
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( result => {
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( result => {
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
				expect( stubs.GraphQLClient.request.calledOnce ).to.equal( true );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { query: 'search query', cursor: null } );
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
				expect( stubs.GraphQLClient.request.callCount ).to.equal( 3 );

				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 0 ).args[ 1 ] ).to.deep.equal( { query: 'search query', cursor: null } );

				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 1 ).args[ 1 ] ).to.deep.equal( { query: 'search query', cursor: 'cursor' } );

				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 0 ] ).to.equal( 'query SearchIssuesToStale' );
				expect( stubs.GraphQLClient.request.getCall( 2 ).args[ 1 ] ).to.deep.equal( { query: 'search query', cursor: 'cursor' } );
			} );
		} );

		it( 'should fetch all timeline events for any issue if they are paginated', () => {
			const issues = [
				{ ...issueBase, number: 1, timelineItems: {
					nodes: [],
					pageInfo: pageInfoWithNextPage
				} }
			];

			sinon.stub( githubRepository, 'getIssueTimelineItems' ).resolves( [] );

			stubs.GraphQLClient.request.resolves( {
				search: {
					issueCount: issues.length,
					nodes: issues,
					pageInfo: pageInfoNoNextPage
				}
			} );

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
				expect( githubRepository.getIssueTimelineItems.callCount ).to.equal( 1 );

				expect( githubRepository.getIssueTimelineItems.getCall( 0 ).args[ 0 ] ).to.equal( 'IssueId' );
				expect( githubRepository.getIssueTimelineItems.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( result => {
				expect( result ).to.be.an( 'array' );
				expect( result ).to.have.length( 3 );
				expect( result[ 0 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#1' } );
				expect( result[ 1 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#2' } );
				expect( result[ 2 ] ).to.deep.equal( { id: 'IssueId', slug: 'ckeditor/ckeditor5#3' } );
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
				const expectedIssue = {
					...issueBase,
					lastReactedAt: null,
					timelineItems: []
				};

				expect( stubs.isIssueStale.callCount ).to.equal( 3 );

				expect( stubs.isIssueStale.getCall( 0 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 1 } );
				expect( stubs.isIssueStale.getCall( 0 ).args[ 1 ] ).to.deep.equal( optionsBase );

				expect( stubs.isIssueStale.getCall( 1 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 2 } );
				expect( stubs.isIssueStale.getCall( 1 ).args[ 1 ] ).to.deep.equal( optionsBase );

				expect( stubs.isIssueStale.getCall( 2 ).args[ 0 ] ).to.deep.equal( { ...expectedIssue, number: 3 } );
				expect( stubs.isIssueStale.getCall( 2 ).args[ 1 ] ).to.deep.equal( optionsBase );
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then( () => {
				expect( onProgress.callCount ).to.equal( 3 );

				expect( onProgress.getCall( 0 ).args[ 0 ] ).to.deep.equal( { done: 1, total: 3 } );
				expect( onProgress.getCall( 1 ).args[ 0 ] ).to.deep.equal( { done: 2, total: 3 } );
				expect( onProgress.getCall( 2 ).args[ 0 ] ).to.deep.equal( { done: 3, total: 3 } );
			} );
		} );

		it( 'should reject if request failed', () => {
			stubs.GraphQLClient.request.rejects( new Error( '500 Internal Server Error' ) );

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then(
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then(
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

			return githubRepository.searchIssuesToStale( optionsBase, onProgress ).then(
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

		it( 'should resolve with the payload if no error occured', () => {
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
			expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal( '⛔ The API limit is exceeded. Request is paused for 28 minutes.' );

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
