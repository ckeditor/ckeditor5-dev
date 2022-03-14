/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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

			createResource: sinon.stub(),
			createResourceStringAsyncUpload: sinon.stub(),
			getResourceStringAsyncUpload: sinon.stub(),

			transifexApi: {
				setup: sinon.stub().callsFake( ( { auth } ) => {
					stubs.transifexApi.auth = sinon.stub().returns( { Authorization: `Bearer ${ auth }` } );
				} ),

				Organization: {
					get: ( ...args ) => stubs.getOrganizations( ...args )
				},

				Resource: {
					create: ( ...args ) => stubs.createResource( ...args )
				},

				ResourceStringAsyncUpload: {
					create: ( ...args ) => stubs.createResourceStringAsyncUpload( ...args ),
					get: ( ...args ) => stubs.getResourceStringAsyncUpload( ...args )
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
		it( 'should return resources and languages, with English language as the source one', async () => {
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
			sinon.assert.calledWithExactly( stubs.fetchProject.firstCall, 'resources' );
			sinon.assert.calledWithExactly( stubs.fetchProject.secondCall, 'languages' );

			expect( resources ).to.deep.equal( [
				{ attributes: { slug: 'ckeditor5-core' } },
				{ attributes: { slug: 'ckeditor5-ui' } }
			] );

			expect( languages ).to.deep.equal( [
				{ attributes: { code: 'en' } },
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
				{ attributes: { code: 'en' } },
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
					{ attributes: { code: 'en' } },
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
			const { translations, failedDownloads } = await transifexService.getTranslations( resource, languages );

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

			sinon.assert.calledWithExactly( stubs.transifexApi.ResourceTranslationAsyncDownload.create.firstCall, {
				attributes,
				relationships: {
					resource,
					language: languages[ 1 ]
				},
				type: 'resource_translations_async_downloads'
			} );

			sinon.assert.calledWithExactly( stubs.transifexApi.ResourceTranslationAsyncDownload.create.secondCall, {
				attributes,
				relationships: {
					resource,
					language: languages[ 2 ]
				},
				type: 'resource_translations_async_downloads'
			} );

			sinon.assert.calledThrice( stubs.fetch );

			sinon.assert.calledWithExactly( stubs.fetch.firstCall, 'https://example.com/ckeditor5-core/en', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			sinon.assert.calledWithExactly( stubs.fetch.secondCall, 'https://example.com/ckeditor5-core/pl', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			sinon.assert.calledWithExactly( stubs.fetch.thirdCall, 'https://example.com/ckeditor5-core/de', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			expect( [ ...translations.entries() ] ).to.deep.equal( [
				[ 'en', 'ckeditor5-core-en-content' ],
				[ 'pl', 'ckeditor5-core-pl-content' ],
				[ 'de', 'ckeditor5-core-de-content' ]
			] );

			expect( failedDownloads ).to.deep.equal( [] );
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

			const { translations, failedDownloads } = await translationsPromise;

			sinon.assert.callCount( stubs.fetch, 23 );

			expect( [ ...translations.entries() ] ).to.deep.equal( [
				[ 'en', 'ckeditor5-core-en-content' ],
				[ 'pl', 'ckeditor5-core-pl-content' ],
				[ 'de', 'ckeditor5-core-de-content' ]
			] );

			expect( failedDownloads ).to.deep.equal( [] );
		} );

		it( 'should return failed requests if all file downloads failed', async () => {
			stubs.fetch.resolves( {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			} );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const { translations, failedDownloads } = await transifexService.getTranslations( resource, languages );

			const expectedFailedDownloads = [ 'en', 'pl', 'de' ].map( languageCode => ( {
				resourceName: 'ckeditor5-core',
				languageCode,
				errorMessage: 'Failed to download the translation file. Received response: 500 Internal Server Error'
			} ) );

			expect( failedDownloads ).to.deep.equal( expectedFailedDownloads );
			expect( [ ...translations.entries() ] ).to.deep.equal( [] );
		} );

		it( 'should return failed requests if the retry limit has been reached for all requests', async () => {
			const clock = sinon.useFakeTimers();

			stubs.fetch.resolves( {
				ok: true,
				redirected: false
			} );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await clock.tickAsync( 30000 );

			const { translations, failedDownloads } = await translationsPromise;

			const expectedFailedDownloads = [ 'en', 'pl', 'de' ].map( languageCode => ( {
				resourceName: 'ckeditor5-core',
				languageCode,
				errorMessage: 'Failed to download the translation file. ' +
					'Requested file is not ready yet, but the limit of file download attempts has been reached.'
			} ) );

			expect( failedDownloads ).to.deep.equal( expectedFailedDownloads );
			expect( [ ...translations.entries() ] ).to.deep.equal( [] );
		} );

		it( 'should return failed requests if it is not possible to create all initial download requests', async () => {
			const clock = sinon.useFakeTimers();

			stubs.transifexApi.ResourceStringAsyncDownload.create.rejects();
			stubs.transifexApi.ResourceTranslationAsyncDownload.create.rejects();

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await clock.tickAsync( 30000 );

			const { translations, failedDownloads } = await translationsPromise;

			const expectedFailedDownloads = [ 'en', 'pl', 'de' ].map( languageCode => ( {
				resourceName: 'ckeditor5-core',
				languageCode,
				errorMessage: 'Failed to create download request.'
			} ) );

			expect( failedDownloads ).to.deep.equal( expectedFailedDownloads );
			expect( [ ...translations.entries() ] ).to.deep.equal( [] );
		} );

		it( 'should return requested translations and failed downloads in multiple different download scenarios', async () => {
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

			const rejectFetch = () => Promise.resolve( {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			} );

			stubs.transifexApi.ResourceStringAsyncDownload.create.rejects();

			stubs.transifexApi.ResourceTranslationAsyncDownload.create
				.onCall( 0 )
				.rejects()
				.onCall( 1 )
				.rejects()
				.onCall( 2 )
				.rejects();

			stubs.fetch
				.withArgs( 'https://example.com/ckeditor5-core/pl' )
				.callsFake( redirectFetch )
				.onCall( 4 )
				.callsFake( resolveFetch );

			stubs.fetch
				.withArgs( 'https://example.com/ckeditor5-core/de' )
				.callsFake( redirectFetch )
				.onCall( 8 )
				.callsFake( rejectFetch );

			const resource = mocks.resources[ 0 ];
			const languages = [ ...mocks.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await clock.tickAsync( 60000 );

			const { translations, failedDownloads } = await translationsPromise;

			sinon.assert.callCount( stubs.fetch, 14 );

			expect( [ ...translations.entries() ] ).to.deep.equal( [
				[ 'pl', 'ckeditor5-core-pl-content' ]
			] );

			expect( failedDownloads ).to.deep.equal( [
				{
					resourceName: 'ckeditor5-core',
					languageCode: 'en',
					errorMessage: 'Failed to create download request.'
				},
				{
					resourceName: 'ckeditor5-core',
					languageCode: 'de',
					errorMessage: 'Failed to download the translation file. Received response: 500 Internal Server Error'
				}
			] );
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

	describe( 'createResource', () => {
		it( 'should create a new resource and return its attributes', () => {
			const organizationName = 'ckeditor';
			const projectName = 'ckeditor5';
			const resourceName = 'ckeditor5-foo';

			const apiResponse = {
				data: {
					attributes: {},
					id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo',
					links: {},
					relationships: {
						i18n_format: {
							data: {
								id: 'PO',
								type: 'i18n_formats'
							}
						},
						project: {
							data: {
								id: 'o:ckeditor:p:ckeditor5',
								type: 'projects'
							}
						}
					},
					type: 'resources'
				}
			};

			stubs.createResource.resolves( apiResponse );

			return transifexService.createResource( { organizationName, projectName, resourceName } )
				.then( response => {
					expect( stubs.createResource.callCount ).to.equal( 1 );
					expect( stubs.createResource.firstCall.args[ 0 ] ).to.deep.equal( {
						name: 'ckeditor5-foo',
						relationships: {
							i18n_format: {
								data: {
									id: 'PO',
									type: 'i18n_formats'
								}
							},
							project: {
								data: {
									id: 'o:ckeditor:p:ckeditor5',
									type: 'projects'
								}
							}
						},
						slug: 'ckeditor5-foo'
					} );

					expect( response ).to.equal( apiResponse );
				} );
		} );

		it( 'should reject a promise if Transifex API rejected', () => {
			const organizationName = 'ckeditor';
			const projectName = 'ckeditor5';
			const resourceName = 'ckeditor5-foo';

			const apiError = new Error( 'JsonApiError: 418, I\'m a teapot' );

			stubs.createResource.rejects( apiError );

			return transifexService.createResource( { organizationName, projectName, resourceName } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( apiError ).to.equal( err );
					}
				);
		} );
	} );

	describe( 'createSourceFile', () => {
		it( 'should create a new resource and return its attributes', () => {
			const organizationName = 'ckeditor';
			const projectName = 'ckeditor5';
			const resourceName = 'ckeditor5-foo';
			const content = '# ckeditor5-foo';

			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				type: 'resource_strings_async_uploads'
			};

			stubs.createResourceStringAsyncUpload.resolves( apiResponse );

			return transifexService.createSourceFile( { organizationName, projectName, resourceName, content } )
				.then( response => {
					expect( stubs.createResourceStringAsyncUpload.callCount ).to.equal( 1 );
					expect( stubs.createResourceStringAsyncUpload.firstCall.args[ 0 ] ).to.deep.equal( {
						attributes: {
							content: '# ckeditor5-foo',
							content_encoding: 'text'
						},
						relationships: {
							resource: {
								data: {
									id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo',
									type: 'resources'
								}
							}
						},
						type: 'resource_strings_async_uploads'
					} );

					expect( response ).to.equal( apiResponse.id );
				} );
		} );

		it( 'should reject a promise if Transifex API rejected', () => {
			const organizationName = 'ckeditor';
			const projectName = 'ckeditor5';
			const resourceName = 'ckeditor5-foo';
			const content = '# ckeditor5-foo';

			const apiError = new Error( 'JsonApiError: 418, I\'m a teapot' );

			stubs.createResourceStringAsyncUpload.rejects( apiError );

			return transifexService.createSourceFile( { organizationName, projectName, resourceName, content } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( apiError ).to.equal( err );
					}
				);
		} );
	} );

	describe( 'getResourceUploadDetails', () => {
		let clock;

		beforeEach( () => {
			clock = sinon.useFakeTimers();
		} );

		afterEach( () => {
			clock.restore();
		} );

		it( 'should return a promise with resolved upload details (Transifex processed the upload)', async () => {
			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				attributes: {
					status: 'succeeded'
				},
				type: 'resource_strings_async_uploads'
			};

			stubs.getResourceStringAsyncUpload.resolves( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( promise ).to.be.a( 'promise' );
			expect( stubs.getResourceStringAsyncUpload.callCount ).to.equal( 1 );
			expect( stubs.getResourceStringAsyncUpload.firstCall.args[ 0 ] ).to.equal( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			const result = await promise;

			expect( result ).to.equal( apiResponse );
		} );

		it( 'should return a promise that resolves after 3000ms (Transifex processed the upload 1s, status=pending)', async () => {
			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				attributes: {
					status: 'succeeded'
				},
				type: 'resource_strings_async_uploads'
			};

			stubs.getResourceStringAsyncUpload.onFirstCall().resolves( {
				attributes: { status: 'pending' }
			} );
			stubs.getResourceStringAsyncUpload.onSecondCall().resolves( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( promise ).to.be.a( 'promise' );
			expect( stubs.getResourceStringAsyncUpload.callCount ).to.equal( 1 );
			expect( stubs.getResourceStringAsyncUpload.firstCall.args[ 0 ] ).to.equal( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			await clock.tickAsync( 3000 );
			expect( stubs.getResourceStringAsyncUpload.callCount ).to.equal( 2 );
			expect( stubs.getResourceStringAsyncUpload.secondCall.args[ 0 ] ).to.equal( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( await promise ).to.equal( apiResponse );
		} );

		it( 'should return a promise that resolves after 3000ms (Transifex processed the upload 1s, status=processing)', async () => {
			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				attributes: {
					status: 'succeeded'
				},
				type: 'resource_strings_async_uploads'
			};

			stubs.getResourceStringAsyncUpload.onFirstCall().resolves( {
				attributes: { status: 'processing' }
			} );
			stubs.getResourceStringAsyncUpload.onSecondCall().resolves( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( promise ).to.be.a( 'promise' );
			expect( stubs.getResourceStringAsyncUpload.callCount ).to.equal( 1 );
			expect( stubs.getResourceStringAsyncUpload.firstCall.args[ 0 ] ).to.equal( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			await clock.tickAsync( 3000 );
			expect( stubs.getResourceStringAsyncUpload.callCount ).to.equal( 2 );
			expect( stubs.getResourceStringAsyncUpload.secondCall.args[ 0 ] ).to.equal( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( await promise ).to.equal( apiResponse );
		} );

		it( 'should return a promise that rejects if Transifex returned an error (no-delay)', async () => {
			const apiResponse = new Error( 'JsonApiError' );

			stubs.getResourceStringAsyncUpload.rejects( apiResponse );

			return transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( apiResponse );
					}
				);
		} );

		it( 'should return a promise that rejects if Transifex returned an error (delay)', async () => {
			const apiResponse = new Error( 'JsonApiError' );

			stubs.getResourceStringAsyncUpload.onFirstCall().resolves( {
				attributes: { status: 'processing' }
			} );
			stubs.getResourceStringAsyncUpload.onSecondCall().rejects( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.equal( apiResponse );
					}
				);

			expect( promise ).to.be.a( 'promise' );

			await clock.tickAsync( 3000 );

			return promise;
		} );

		it( 'should return a promise that rejects if reached the maximum number of requests to Transifex', async () => {
			// 10 is equal to the `MAX_REQUEST_ATTEMPTS` constant.
			for ( let i = 0; i < 10; ++i ) {
				stubs.getResourceStringAsyncUpload.onCall( i ).resolves( {
					attributes: { status: 'processing' }
				} );
			}

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).to.deep.equal( {
							errors: [
								{
									detail: 'Failed to retrieve the upload details.'
								}
							]
						} );
					}
				);

			expect( promise ).to.be.a( 'promise' );

			for ( let i = 0; i < 9; ++i ) {
				expect( stubs.getResourceStringAsyncUpload.callCount, `getResourceStringAsyncUpload, call: ${ i + 1 }` ).to.equal( i + 1 );
				await clock.tickAsync( 3000 );
			}

			return promise;
		} );
	} );
} );
