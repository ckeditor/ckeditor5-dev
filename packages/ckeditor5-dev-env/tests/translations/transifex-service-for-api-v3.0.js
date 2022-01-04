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

				...[ 'ResourceStringAsyncDownload', 'ResourceTranslationAsyncDownload' ].reduce( ( result, methodName ) => {
					result[ methodName ] = {
						create: sinon.stub().callsFake( ( { attributes, relationships, type } ) => {
							const resourceName = relationships.resource.attributes.slug;
							const languageCode = relationships.language ? relationships.language.attributes.code : 'en';

							return Promise.resolve( {
								attributes,
								type,
								links: {
									self: `https://example.com/${ resourceName }/${ languageCode }`
								},
								related: relationships
							} );
						} )
					};

					return result;
				}, {} )
			},

			fetch: sinon.stub()
		};

		mockery.registerMock( '@transifex/api', { transifexApi: stubs.transifexApi } );
		mockery.registerMock( 'node-fetch', stubs.fetch );

		transifexService = require( '../../lib/translations/transifex-service-for-api-v3.0' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	describe( 'init()', () => {
		it( 'should pass the token to the Transifex API', () => {
			transifexService.init( 'secretToken' );

			expect( stubs.transifexApi.auth ).to.be.a( 'function' );
			expect( stubs.transifexApi.auth() ).to.deep.equal( { Authorization: 'Bearer secretToken' } );
		} );

		it( 'should pass the token to the Transifex API only once', () => {
			transifexService.init( 'secretToken' );
			transifexService.init( 'anotherSecretToken' );
			transifexService.init( 'evenBetterSecretToken' );

			sinon.assert.calledOnce( stubs.transifexApi.setup );

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

			const { resources, languages } = await transifexService.getProjectData(
				'ckeditor-organization', 'ckeditor5-project', [ 'ckeditor5-core', 'ckeditor5-ui' ]
			);

			sinon.assert.calledOnce( stubs.getOrganizations );
			sinon.assert.calledWithExactly( stubs.getOrganizations, { slug: 'ckeditor-organization' } );

			sinon.assert.calledOnce( stubs.fetchOrganization );
			sinon.assert.calledWithExactly( stubs.fetchOrganization, 'projects' );

			sinon.assert.calledOnce( stubs.getProjects );
			sinon.assert.calledWithExactly( stubs.getProjects, { slug: 'ckeditor5-project' } );

			sinon.assert.calledTwice( stubs.fetchProject );
			sinon.assert.calledWithExactly( stubs.fetchProject, 'resources' );
			sinon.assert.calledWithExactly( stubs.fetchProject, 'languages' );

			expect( resources ).to.deep.equal( [
				{ attributes: { slug: 'ckeditor5-core' } },
				{ attributes: { slug: 'ckeditor5-ui' } }
			] );

			expect( languages ).to.deep.equal( [
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'de' } }
			] );
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

			const { resources, languages } = await transifexService.getProjectData(
				'ckeditor-organization', 'ckeditor5-project', [ 'ckeditor5-core', 'ckeditor5-non-existing' ]
			);

			expect( resources ).to.deep.equal( [
				{ attributes: { slug: 'ckeditor5-core' } }
			] );

			expect( languages ).to.deep.equal( [
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'de' } }
			] );
		} );
	} );

	describe( 'getTranslations()', () => {
		beforeEach( () => {
			mocks = {
				resources: [
					{ attributes: { slug: 'ckeditor5-core' } },
					{ attributes: { slug: 'ckeditor5-ui' } }
				],
				languages: [
					{ attributes: { code: 'pl' } },
					{ attributes: { code: 'de' } }
				],
				translations: {
					'https://example.com/ckeditor5-core/en': 'ckeditor5-core-en-content',
					'https://example.com/ckeditor5-core/pl': 'ckeditor5-core-pl-content',
					'https://example.com/ckeditor5-core/de': 'ckeditor5-core-de-content',
					'https://example.com/ckeditor5-ui/en': 'ckeditor5-ui-en-content',
					'https://example.com/ckeditor5-ui/pl': 'ckeditor5-ui-pl-content',
					'https://example.com/ckeditor5-ui/de': 'ckeditor5-ui-de-content'
				}
			};

			transifexService.init( 'secretToken' );
		} );

		it( 'should return requested translations if no retries are needed', async () => {
			stubs.fetch.callsFake( url => Promise.resolve( {
				ok: true,
				redirected: true,
				text: () => Promise.resolve( mocks.translations[ url ] )
			} ) );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const translations = await transifexService.getTranslations( resource, languages );

			const attributes = {
				callback_url: null,
				content_encoding: 'text',
				file_type: 'default',
				pseudo: false
			};

			sinon.assert.calledOnce( stubs.transifexApi.ResourceStringAsyncDownload.create );

			sinon.assert.calledWithExactly( stubs.transifexApi.ResourceStringAsyncDownload.create, {
				attributes,
				relationships: {
					resource
				},
				type: 'resource_strings_async_downloads'
			} );

			sinon.assert.calledTwice( stubs.transifexApi.ResourceTranslationAsyncDownload.create );

			sinon.assert.calledWithExactly( stubs.transifexApi.ResourceTranslationAsyncDownload.create, {
				attributes,
				relationships: {
					resource,
					language: languages[ 0 ]
				},
				type: 'resource_translations_async_downloads'
			} );

			sinon.assert.calledWithExactly( stubs.transifexApi.ResourceTranslationAsyncDownload.create, {
				attributes,
				relationships: {
					resource,
					language: languages[ 1 ]
				},
				type: 'resource_translations_async_downloads'
			} );

			sinon.assert.calledThrice( stubs.fetch );

			sinon.assert.calledWithExactly( stubs.fetch, 'https://example.com/ckeditor5-core/en', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			sinon.assert.calledWithExactly( stubs.fetch, 'https://example.com/ckeditor5-core/pl', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			sinon.assert.calledWithExactly( stubs.fetch, 'https://example.com/ckeditor5-core/de', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			expect( [ ...translations.entries() ] ).to.deep.equal( [
				[ 'en', 'ckeditor5-core-en-content' ],
				[ 'pl', 'ckeditor5-core-pl-content' ],
				[ 'de', 'ckeditor5-core-de-content' ]
			] );
		} );

		it( 'should return requested translations after multiple different download retries', async () => {
			const clock = sinon.useFakeTimers();

			const redirectFetch = () => Promise.resolve( {
				ok: true,
				redirected: false
			} );

			const resolveFetch = url => Promise.resolve( {
				ok: true,
				redirected: true,
				text: () => Promise.resolve( mocks.translations[ url ] )
			} );

			stubs.fetch
				.withArgs( 'https://example.com/ckeditor5-core/en' )
				.callsFake( redirectFetch )
				.onCall( 9 )
				.callsFake( resolveFetch );

			stubs.fetch
				.withArgs( 'https://example.com/ckeditor5-core/pl' )
				.callsFake( redirectFetch )
				.onCall( 4 )
				.callsFake( resolveFetch );

			stubs.fetch
				.withArgs( 'https://example.com/ckeditor5-core/de' )
				.callsFake( redirectFetch )
				.onCall( 7 )
				.callsFake( resolveFetch );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await clock.tickAsync( 30000 );

			const translations = await translationsPromise;

			sinon.assert.callCount( stubs.fetch, 23 );

			expect( [ ...translations.entries() ] ).to.deep.equal( [
				[ 'en', 'ckeditor5-core-en-content' ],
				[ 'pl', 'ckeditor5-core-pl-content' ],
				[ 'de', 'ckeditor5-core-de-content' ]
			] );
		} );

		it( 'should fail with an error if a response from the download attempt was not successful', async () => {
			stubs.fetch.callsFake( () => Promise.resolve( {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			} ) );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const errorMessage = await transifexService.getTranslations( resource, languages ).catch( error => error.message );

			expect( errorMessage ).to.equal(
				'Failed to download the PO file for the en language for the ckeditor5-core package.\n' +
				'Received response: 500 Internal Server Error'
			);
		} );

		it( 'should fail with an error if the download limit has been reached', async () => {
			const clock = sinon.useFakeTimers();

			stubs.fetch.callsFake( () => Promise.resolve( {
				ok: true,
				redirected: false
			} ) );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const errorMessagePromise = transifexService.getTranslations( resource, languages ).catch( error => error.message );

			await clock.tickAsync( 30000 );

			const errorMessage = await errorMessagePromise;

			expect( errorMessage ).to.equal(
				'Failed to download the PO file for the en language for the ckeditor5-core package.\n' +
				'Requested file is not ready yet, but the limit of file download attempts has been reached.'
			);
		} );
	} );

	describe( 'getResourceName()', () => {
		it( 'should extract the resource name from the resource instance', () => {
			const resource = { attributes: { slug: 'ckeditor5-core' } };

			expect( transifexService.getResourceName( resource ) ).to.equal( 'ckeditor5-core' );
		} );
	} );

	describe( 'getLanguageCode()', () => {
		it( 'should extract the language code from the language instance', () => {
			const language = { attributes: { code: 'pl' } };

			expect( transifexService.getLanguageCode( language ) ).to.equal( 'pl' );
		} );
	} );
} );
