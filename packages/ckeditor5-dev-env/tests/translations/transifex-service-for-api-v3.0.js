/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const mockery = require( 'mockery' );

describe( 'dev-env/translations/transifex-service-for-api-v3.0', () => {
	let stubs, mocks, transifexService;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			getOrganizations: sinon.stub().callsFake( () => Promise.resolve( {
				fetch: stubs.fetchOrganization
			} ) ),

			fetchOrganization: sinon.stub().callsFake( () => Promise.resolve( {
				get: stubs.getProjects
			} ) ),

			getProjects: sinon.stub().callsFake( () => Promise.resolve( {
				fetch: stubs.fetchProject
			} ) ),

			fetchProject: sinon.stub().callsFake( resourceType => Promise.resolve( {
				async* all() {
					for ( const item of mocks[ resourceType ] ) {
						yield item;
					}
				}
			} ) ),

			transifexApi: {
				setup: sinon.stub().callsFake( ( { auth } ) => {
					stubs.transifexApi.auth = sinon.stub().returns( { Authorization: `Bearer ${ auth }` } );
				} ),

				Organization: {
					get: ( ...args ) => stubs.getOrganizations( ...args )
				},

				...[ 'ResourceTranslationAsyncDownload', 'ResourceStringAsyncDownload' ].reduce( ( result, methodName ) => {
					result[ methodName ] = {
						create: sinon.stub().callsFake( ( { relationships } ) => {
							return Promise.resolve( {
								links: {
									self: 'https://example.com/foo/bar'
								},
								related: relationships
							} );
						} )
					};

					return result;
				}, {} )
			}
		};

		mockery.registerMock( '@transifex/api', { transifexApi: stubs.transifexApi } );

		transifexService = require( '../../lib/translations/transifex-service-for-api-v3.0' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	describe( 'init()', () => {
		it( 'should pass the token to the Transifex API', () => {
			transifexService.init( { token: 'secretToken' } );

			expect( stubs.transifexApi.auth ).to.be.a( 'function' );
			expect( stubs.transifexApi.auth() ).to.deep.equal( { Authorization: 'Bearer secretToken' } );
		} );

		it( 'should pass the token to the Transifex API only once', () => {
			transifexService.init( { token: 'secretToken' } );
			transifexService.init( { token: 'anotherSecretToken' } );

			expect( stubs.transifexApi.auth ).to.be.a( 'function' );
			expect( stubs.transifexApi.auth() ).to.deep.equal( { Authorization: 'Bearer secretToken' } );
		} );
	} );

	describe( 'getProjectData()', () => {
		it( 'should return resources and languages', async () => {
			mocks = {
				resources: [
					{ attributes: { slug: 'ckeditor5-core' } },
					{ attributes: { slug: 'ckeditor5-ui' } }
				],
				languages: [
					{ attributes: { code: 'pl' } },
					{ attributes: { code: 'de' } }
				]
			};

			const { resources, languages } = await transifexService.getProjectData( {
				localizablePackageNames: [ 'ckeditor5-core', 'ckeditor5-ui' ]
			} );

			expect( resources ).to.deep.equal( [
				{ attributes: { slug: 'ckeditor5-core' } },
				{ attributes: { slug: 'ckeditor5-ui' } }
			] );

			expect( languages ).to.deep.equal( [
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'de' } }
			] );

			sinon.assert.calledOnce( stubs.getOrganizations );
			sinon.assert.calledWithExactly( stubs.getOrganizations, { slug: 'ckeditor' } );

			sinon.assert.calledOnce( stubs.fetchOrganization );
			sinon.assert.calledWithExactly( stubs.fetchOrganization, 'projects' );

			sinon.assert.calledOnce( stubs.getProjects );
			sinon.assert.calledWithExactly( stubs.getProjects, { slug: 'ckeditor5' } );

			sinon.assert.calledTwice( stubs.fetchProject );
			sinon.assert.calledWithExactly( stubs.fetchProject, 'resources' );
			sinon.assert.calledWithExactly( stubs.fetchProject, 'languages' );
		} );

		it( 'should return only the available resources that were requested', async () => {
			mocks = {
				resources: [
					{ attributes: { slug: 'ckeditor5-core' } },
					{ attributes: { slug: 'ckeditor5-ui' } }
				],
				languages: [
					{ attributes: { code: 'pl' } },
					{ attributes: { code: 'de' } }
				]
			};

			const { resources, languages } = await transifexService.getProjectData( {
				localizablePackageNames: [ 'ckeditor5-core', 'ckeditor5-non-existing' ]
			} );

			expect( resources ).to.deep.equal( [
				{ attributes: { slug: 'ckeditor5-core' } }
			] );

			expect( languages ).to.deep.equal( [
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'de' } }
			] );
		} );
	} );
} );
