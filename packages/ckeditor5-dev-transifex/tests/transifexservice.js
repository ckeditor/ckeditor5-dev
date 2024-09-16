/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import transifexService from '../lib/transifexservice.js';

const {
	transifexApiMock
} = vi.hoisted( () => {
	return {
		transifexApiMock: {}
	};
} );

vi.mock( '@transifex/api', () => {
	return {
		transifexApi: transifexApiMock
	};
} );

describe( 'dev-transifex/transifex-service', () => {
	let testData;

	let fetchMock;

	let createResourceMock;
	let createResourceStringsAsyncUploadMock;
	let dataResourceTranslationsMock;
	let fetchOrganizationMock;
	let fetchProjectMock;
	let fetchResourceTranslationsMock;
	let filterResourceTranslationsMock;
	let getNextResourceTranslationsMock;
	let getOrganizationsMock;
	let getProjectsMock;
	let getResourceStringsAsyncUploadMock;
	let includeResourceTranslationsMock;

	beforeEach( () => {
		fetchMock = vi.fn();

		vi.stubGlobal( 'fetch', fetchMock );

		createResourceMock = vi.fn();
		createResourceStringsAsyncUploadMock = vi.fn();
		fetchResourceTranslationsMock = vi.fn();
		filterResourceTranslationsMock = vi.fn();
		getNextResourceTranslationsMock = vi.fn();
		getResourceStringsAsyncUploadMock = vi.fn();
		includeResourceTranslationsMock = vi.fn();

		getOrganizationsMock = vi.fn().mockImplementation( () => Promise.resolve( {
			fetch: fetchOrganizationMock
		} ) );

		fetchOrganizationMock = vi.fn().mockImplementation( () => Promise.resolve( {
			get: getProjectsMock
		} ) );

		getProjectsMock = vi.fn().mockImplementation( () => Promise.resolve( {
			fetch: fetchProjectMock
		} ) );

		fetchProjectMock = vi.fn().mockImplementation( resourceType => Promise.resolve( {
			async* all() {
				for ( const item of testData[ resourceType ] ) {
					yield item;
				}
			}
		} ) );

		transifexApiMock.setup = vi.fn().mockImplementation( ( { auth } ) => {
			transifexApiMock.auth = vi.fn().mockReturnValue( { Authorization: `Bearer ${ auth }` } );
		} );

		transifexApiMock.Organization = {
			get: ( ...args ) => getOrganizationsMock( ...args )
		};

		transifexApiMock.Resource = {
			create: ( ...args ) => createResourceMock( ...args )
		};

		transifexApiMock.ResourceStringsAsyncUpload = {
			create: ( ...args ) => createResourceStringsAsyncUploadMock( ...args ),
			get: ( ...args ) => getResourceStringsAsyncUploadMock( ...args )
		};

		transifexApiMock.ResourceStringsAsyncDownload = resourceAsyncDownloadMockFactory();
		transifexApiMock.ResourceTranslationsAsyncDownload = resourceAsyncDownloadMockFactory();

		transifexApiMock.ResourceTranslation = {
			filter: ( ...args ) => {
				filterResourceTranslationsMock( ...args );

				return {
					include: ( ...args ) => {
						includeResourceTranslationsMock( ...args );

						return {
							fetch: ( ...args ) => fetchResourceTranslationsMock( ...args ),
							get data() {
								return dataResourceTranslationsMock;
							},
							get next() {
								return !!getNextResourceTranslationsMock;
							},
							getNext: () => getNextResourceTranslationsMock()
						};
					}
				};
			}
		};
	} );

	afterEach( () => {
		vi.useRealTimers();

		// Restoring mock of Transifex API.
		Object.keys( transifexApiMock ).forEach( mockedKey => delete transifexApiMock[ mockedKey ] );
	} );

	describe( 'init()', () => {
		it( 'should pass the token to the Transifex API', () => {
			transifexService.init( 'secretToken' );

			expect( transifexApiMock.auth ).toBeInstanceOf( Function );
			expect( transifexApiMock.auth() ).toEqual( { Authorization: 'Bearer secretToken' } );
		} );

		it( 'should pass the token to the Transifex API only once', () => {
			transifexService.init( 'secretToken' );
			transifexService.init( 'anotherSecretToken' );
			transifexService.init( 'evenBetterSecretToken' );

			expect( transifexApiMock.setup ).toHaveBeenCalledTimes( 1 );

			expect( transifexApiMock.auth ).toBeInstanceOf( Function );
			expect( transifexApiMock.auth() ).toEqual( { Authorization: 'Bearer secretToken' } );
		} );
	} );

	describe( 'getProjectData()', () => {
		it( 'should return resources and languages, with English language as the source one', async () => {
			testData = {
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

			expect( getOrganizationsMock ).toHaveBeenCalledTimes( 1 );
			expect( getOrganizationsMock ).toHaveBeenCalledWith( { slug: 'ckeditor-organization' } );

			expect( fetchOrganizationMock ).toHaveBeenCalledTimes( 1 );
			expect( fetchOrganizationMock ).toHaveBeenCalledWith( 'projects' );

			expect( getProjectsMock ).toHaveBeenCalledTimes( 1 );
			expect( getProjectsMock ).toHaveBeenCalledWith( { slug: 'ckeditor5-project' } );

			expect( fetchProjectMock ).toHaveBeenCalledTimes( 2 );
			expect( fetchProjectMock ).toHaveBeenNthCalledWith( 1, 'resources' );
			expect( fetchProjectMock ).toHaveBeenNthCalledWith( 2, 'languages' );

			expect( resources ).toEqual( [
				{ attributes: { slug: 'ckeditor5-core' } },
				{ attributes: { slug: 'ckeditor5-ui' } }
			] );

			expect( languages ).toEqual( [
				{ attributes: { code: 'en' } },
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'de' } }
			] );
		} );

		it( 'should return only the available resources that were requested', async () => {
			testData = {
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

			expect( resources ).toEqual( [
				{ attributes: { slug: 'ckeditor5-core' } }
			] );

			expect( languages ).toEqual( [
				{ attributes: { code: 'en' } },
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'de' } }
			] );
		} );
	} );

	describe( 'getTranslations()', () => {
		beforeEach( () => {
			testData = {
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
			vi.mocked( fetchMock ).mockImplementation( url => Promise.resolve( {
				ok: true,
				redirected: true,
				text: () => Promise.resolve( testData.translations[ url ] )
			} ) );

			const resource = testData.resources[ 0 ];
			const languages = [ ...testData.languages ];
			const { translations, failedDownloads } = await transifexService.getTranslations( resource, languages );

			const attributes = {
				callback_url: null,
				content_encoding: 'text',
				file_type: 'default',
				pseudo: false
			};

			expect( transifexApiMock.ResourceStringsAsyncDownload.create ).toHaveBeenCalledTimes( 1 );

			expect( transifexApiMock.ResourceStringsAsyncDownload.create ).toHaveBeenCalledWith( {
				attributes,
				relationships: {
					resource
				},
				type: 'resource_strings_async_downloads'
			} );

			expect( transifexApiMock.ResourceTranslationsAsyncDownload.create ).toHaveBeenCalledTimes( 2 );

			expect( transifexApiMock.ResourceTranslationsAsyncDownload.create ).toHaveBeenNthCalledWith( 1, {
				attributes,
				relationships: {
					resource,
					language: languages[ 1 ]
				},
				type: 'resource_translations_async_downloads'
			} );

			expect( transifexApiMock.ResourceTranslationsAsyncDownload.create ).toHaveBeenNthCalledWith( 2, {
				attributes,
				relationships: {
					resource,
					language: languages[ 2 ]
				},
				type: 'resource_translations_async_downloads'
			} );

			expect( fetchMock ).toHaveBeenCalledTimes( 3 );

			expect( fetchMock ).toHaveBeenNthCalledWith( 1, 'https://example.com/ckeditor5-core/en', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			expect( fetchMock ).toHaveBeenNthCalledWith( 2, 'https://example.com/ckeditor5-core/pl', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			expect( fetchMock ).toHaveBeenNthCalledWith( 3, 'https://example.com/ckeditor5-core/de', {
				headers: {
					Authorization: 'Bearer secretToken'
				}
			} );

			expect( [ ...translations.entries() ] ).toEqual( [
				[ 'en', 'ckeditor5-core-en-content' ],
				[ 'pl', 'ckeditor5-core-pl-content' ],
				[ 'de', 'ckeditor5-core-de-content' ]
			] );

			expect( failedDownloads ).toEqual( [] );
		} );

		it( 'should return requested translations after multiple different download retries', async () => {
			vi.useFakeTimers();

			const languageCallsBeforeResolving = {
				en: 9,
				pl: 4,
				de: 7
			};

			fetchMock.mockImplementation( url => {
				const language = url.split( '/' ).pop();

				if ( languageCallsBeforeResolving[ language ] > 0 ) {
					languageCallsBeforeResolving[ language ]--;

					return Promise.resolve( {
						ok: true,
						redirected: false
					} );
				}

				return Promise.resolve( {
					ok: true,
					redirected: true,
					text: () => Promise.resolve( testData.translations[ url ] )
				} );
			} );

			const resource = testData.resources[ 0 ];
			const languages = [ ...testData.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await vi.advanceTimersByTimeAsync( 30000 );

			const { translations, failedDownloads } = await translationsPromise;

			expect( fetchMock ).toHaveBeenCalledTimes( 23 );

			expect( [ ...translations.entries() ] ).toEqual( [
				[ 'en', 'ckeditor5-core-en-content' ],
				[ 'pl', 'ckeditor5-core-pl-content' ],
				[ 'de', 'ckeditor5-core-de-content' ]
			] );

			expect( failedDownloads ).toEqual( [] );
		} );

		it( 'should return failed requests if all file downloads failed', async () => {
			vi.mocked( fetchMock ).mockResolvedValue( {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			} );

			const resource = testData.resources[ 0 ];
			const languages = [ ...testData.languages ];
			const { translations, failedDownloads } = await transifexService.getTranslations( resource, languages );

			const expectedFailedDownloads = [ 'en', 'pl', 'de' ].map( languageCode => ( {
				resourceName: 'ckeditor5-core',
				languageCode,
				errorMessage: 'Failed to download the translation file. Received response: 500 Internal Server Error'
			} ) );

			expect( failedDownloads ).toEqual( expectedFailedDownloads );
			expect( [ ...translations.entries() ] ).toEqual( [] );
		} );

		it( 'should return failed requests if the retry limit has been reached for all requests', async () => {
			vi.useFakeTimers();

			vi.mocked( fetchMock ).mockResolvedValue( {
				ok: true,
				redirected: false
			} );

			const resource = testData.resources[ 0 ];
			const languages = [ ...testData.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await vi.advanceTimersByTimeAsync( 30000 );

			const { translations, failedDownloads } = await translationsPromise;

			const expectedFailedDownloads = [ 'en', 'pl', 'de' ].map( languageCode => ( {
				resourceName: 'ckeditor5-core',
				languageCode,
				errorMessage: 'Failed to download the translation file. ' +
					'Requested file is not ready yet, but the limit of file download attempts has been reached.'
			} ) );

			expect( failedDownloads ).toEqual( expectedFailedDownloads );
			expect( [ ...translations.entries() ] ).toEqual( [] );
		} );

		it( 'should return failed requests if it is not possible to create all initial download requests', async () => {
			vi.useFakeTimers();

			transifexApiMock.ResourceStringsAsyncDownload.create.mockRejectedValue();
			transifexApiMock.ResourceTranslationsAsyncDownload.create.mockRejectedValue();

			const resource = testData.resources[ 0 ];
			const languages = [ ...testData.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await vi.advanceTimersByTimeAsync( 30000 );

			const { translations, failedDownloads } = await translationsPromise;

			const expectedFailedDownloads = [ 'en', 'pl', 'de' ].map( languageCode => ( {
				resourceName: 'ckeditor5-core',
				languageCode,
				errorMessage: 'Failed to create download request.'
			} ) );

			expect( failedDownloads ).toEqual( expectedFailedDownloads );
			expect( [ ...translations.entries() ] ).toEqual( [] );
		} );

		it( 'should return requested translations and failed downloads in multiple different download scenarios', async () => {
			vi.useFakeTimers();

			transifexApiMock.ResourceStringsAsyncDownload.create.mockRejectedValue();

			transifexApiMock.ResourceTranslationsAsyncDownload.create
				.mockRejectedValueOnce()
				.mockRejectedValueOnce()
				.mockRejectedValueOnce();

			const languageCallsBeforeResolving = {
				pl: 4,
				de: 8
			};

			fetchMock.mockImplementation( url => {
				const language = url.split( '/' ).pop();

				if ( languageCallsBeforeResolving[ language ] > 0 ) {
					languageCallsBeforeResolving[ language ]--;

					return Promise.resolve( {
						ok: true,
						redirected: false
					} );
				}

				if ( language === 'pl' ) {
					return Promise.resolve( {
						ok: true,
						redirected: true,
						text: () => Promise.resolve( testData.translations[ url ] )
					} );
				}

				if ( language === 'de' ) {
					return Promise.resolve( {
						ok: false,
						status: 500,
						statusText: 'Internal Server Error'
					} );
				}
			} );

			const resource = testData.resources[ 0 ];
			const languages = [ ...testData.languages ];
			const translationsPromise = transifexService.getTranslations( resource, languages );

			await vi.advanceTimersByTimeAsync( 60000 );

			const { translations, failedDownloads } = await translationsPromise;

			expect( fetchMock ).toHaveBeenCalledTimes( 14 );

			expect( [ ...translations.entries() ] ).toEqual( [
				[ 'pl', 'ckeditor5-core-pl-content' ]
			] );

			expect( failedDownloads ).toEqual( [
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

	describe( 'getResourceTranslations', () => {
		it( 'should return all found translations', () => {
			getNextResourceTranslationsMock = null;
			fetchResourceTranslationsMock.mockImplementation( () => {
				dataResourceTranslationsMock = [
					{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:680k83DmCPu9AkGVwDvVQqCvsJkg93AC:l:en' },
					{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:MbFEbBcsOk43LryccpBHPyeMYBW6G5FV:l:en' },
					{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:tQ8xmNQ706zjL3hiqEsttqUoneZJtV4Q:l:en' }
				];

				return Promise.resolve();
			} );

			return transifexService.getResourceTranslations( 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo', 'l:en' )
				.then( result => {
					expect( result ).toEqual( [
						{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:680k83DmCPu9AkGVwDvVQqCvsJkg93AC:l:en' },
						{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:MbFEbBcsOk43LryccpBHPyeMYBW6G5FV:l:en' },
						{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:tQ8xmNQ706zjL3hiqEsttqUoneZJtV4Q:l:en' }
					] );

					expect( filterResourceTranslationsMock ).toHaveBeenCalledTimes( 1 );
					expect( filterResourceTranslationsMock ).toHaveBeenCalledWith( {
						resource: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo',
						language: 'l:en'
					} );

					expect( includeResourceTranslationsMock ).toHaveBeenCalledTimes( 1 );
					expect( includeResourceTranslationsMock ).toHaveBeenCalledWith( 'resource_string' );

					expect( fetchResourceTranslationsMock ).toHaveBeenCalledTimes( 1 );
				} );
		} );

		it( 'should return all found translations if results are paginated', () => {
			const availableTranslations = [
				{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:680k83DmCPu9AkGVwDvVQqCvsJkg93AC:l:en' },
				{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:MbFEbBcsOk43LryccpBHPyeMYBW6G5FV:l:en' },
				{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:tQ8xmNQ706zjL3hiqEsttqUoneZJtV4Q:l:en' }
			];

			getNextResourceTranslationsMock.mockImplementation( () => {
				dataResourceTranslationsMock = [ availableTranslations.shift() ];

				return Promise.resolve( {
					data: dataResourceTranslationsMock,
					next: availableTranslations.length > 0,
					getNext: getNextResourceTranslationsMock
				} );
			} );

			fetchResourceTranslationsMock.mockImplementation( () => {
				dataResourceTranslationsMock = [ availableTranslations.shift() ];

				return Promise.resolve();
			} );

			return transifexService.getResourceTranslations( 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo', 'l:en' )
				.then( result => {
					expect( result ).toEqual( [
						{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:680k83DmCPu9AkGVwDvVQqCvsJkg93AC:l:en' },
						{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:MbFEbBcsOk43LryccpBHPyeMYBW6G5FV:l:en' },
						{ id: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo:s:tQ8xmNQ706zjL3hiqEsttqUoneZJtV4Q:l:en' }
					] );

					expect( filterResourceTranslationsMock ).toHaveBeenCalledTimes( 1 );
					expect( filterResourceTranslationsMock ).toHaveBeenCalledWith( {
						resource: 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo',
						language: 'l:en'
					} );

					expect( includeResourceTranslationsMock ).toHaveBeenCalledTimes( 1 );
					expect( includeResourceTranslationsMock ).toHaveBeenCalledWith( 'resource_string' );

					expect( fetchResourceTranslationsMock ).toHaveBeenCalledTimes( 1 );
				} );
		} );

		it( 'should reject a promise if Transifex API rejected', async () => {
			const apiError = new Error( 'JsonApiError: 418, I\'m a teapot' );

			fetchResourceTranslationsMock.mockRejectedValue( apiError );

			return transifexService.getResourceTranslations( 'o:ckeditor:p:ckeditor5:r:ckeditor5-foo', 'l:en' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( apiError ).toEqual( error );
					}
				);
		} );
	} );

	describe( 'getResourceName()', () => {
		it( 'should extract the resource name from the resource instance', () => {
			const resource = { attributes: { slug: 'ckeditor5-core' } };

			expect( transifexService.getResourceName( resource ) ).toEqual( 'ckeditor5-core' );
		} );
	} );

	describe( 'getLanguageCode()', () => {
		it( 'should extract the language code from the language instance', () => {
			const language = { attributes: { code: 'pl' } };

			expect( transifexService.getLanguageCode( language ) ).toEqual( 'pl' );
		} );
	} );

	describe( 'isSourceLanguage()', () => {
		it( 'should return false if the language instance is not the source language', () => {
			const language = { attributes: { code: 'pl' } };

			expect( transifexService.isSourceLanguage( language ) ).toEqual( false );
		} );

		it( 'should return true if the language instance is the source language', () => {
			const language = { attributes: { code: 'en' } };

			expect( transifexService.isSourceLanguage( language ) ).toEqual( true );
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

			createResourceMock.mockResolvedValue( apiResponse );

			return transifexService.createResource( { organizationName, projectName, resourceName } )
				.then( response => {
					expect( createResourceMock ).toHaveBeenCalledTimes( 1 );
					expect( createResourceMock ).toHaveBeenCalledWith( {
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

					expect( response ).toEqual( apiResponse );
				} );
		} );

		it( 'should reject a promise if Transifex API rejected', () => {
			const organizationName = 'ckeditor';
			const projectName = 'ckeditor5';
			const resourceName = 'ckeditor5-foo';

			const apiError = new Error( 'JsonApiError: 418, I\'m a teapot' );

			createResourceMock.mockRejectedValue( apiError );

			return transifexService.createResource( { organizationName, projectName, resourceName } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( apiError ).toEqual( err );
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

			createResourceStringsAsyncUploadMock.mockResolvedValue( apiResponse );

			return transifexService.createSourceFile( { organizationName, projectName, resourceName, content } )
				.then( response => {
					expect( createResourceStringsAsyncUploadMock ).toHaveBeenCalledTimes( 1 );
					expect( createResourceStringsAsyncUploadMock ).toHaveBeenCalledWith( {
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

					expect( response ).toEqual( apiResponse.id );
				} );
		} );

		it( 'should reject a promise if Transifex API rejected', () => {
			const organizationName = 'ckeditor';
			const projectName = 'ckeditor5';
			const resourceName = 'ckeditor5-foo';
			const content = '# ckeditor5-foo';

			const apiError = new Error( 'JsonApiError: 418, I\'m a teapot' );

			createResourceStringsAsyncUploadMock.mockRejectedValue( apiError );

			return transifexService.createSourceFile( { organizationName, projectName, resourceName, content } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( apiError ).toEqual( err );
					}
				);
		} );
	} );

	describe( 'getResourceUploadDetails', () => {
		beforeEach( () => {
			vi.useFakeTimers();
		} );

		it( 'should return a promise with resolved upload details (Transifex processed the upload)', async () => {
			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				attributes: {
					status: 'succeeded'
				},
				type: 'resource_strings_async_uploads'
			};

			getResourceStringsAsyncUploadMock.mockResolvedValue( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( promise ).toBeInstanceOf( Promise );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenCalledTimes( 1 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenCalledWith( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			const result = await promise;

			expect( result ).toEqual( apiResponse );
		} );

		it( 'should return a promise that resolves after 3000ms (Transifex processed the upload 1s, status=pending)', async () => {
			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				attributes: {
					status: 'succeeded'
				},
				type: 'resource_strings_async_uploads'
			};

			getResourceStringsAsyncUploadMock.mockResolvedValueOnce( {
				attributes: { status: 'pending' }
			} );
			getResourceStringsAsyncUploadMock.mockResolvedValueOnce( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( promise ).toBeInstanceOf( Promise );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenCalledTimes( 1 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenNthCalledWith( 1, '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			await vi.advanceTimersByTimeAsync( 3000 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenCalledTimes( 2 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenNthCalledWith( 2, '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( await promise ).toEqual( apiResponse );
		} );

		it( 'should return a promise that resolves after 3000ms (Transifex processed the upload 1s, status=processing)', async () => {
			const apiResponse = {
				id: '4abfc726-6a27-4c33-9d99-e5254c8df748',
				attributes: {
					status: 'succeeded'
				},
				type: 'resource_strings_async_uploads'
			};

			getResourceStringsAsyncUploadMock.mockResolvedValueOnce( {
				attributes: { status: 'processing' }
			} );
			getResourceStringsAsyncUploadMock.mockResolvedValueOnce( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( promise ).toBeInstanceOf( Promise );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenCalledTimes( 1 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenNthCalledWith( 1, '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			await vi.advanceTimersByTimeAsync( 3000 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenCalledTimes( 2 );
			expect( getResourceStringsAsyncUploadMock ).toHaveBeenNthCalledWith( 2, '4abfc726-6a27-4c33-9d99-e5254c8df748' );

			expect( await promise ).toEqual( apiResponse );
		} );

		it( 'should return a promise that rejects if Transifex returned an error (no-delay)', async () => {
			const apiResponse = new Error( 'JsonApiError' );

			getResourceStringsAsyncUploadMock.mockRejectedValue( apiResponse );

			return transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( apiResponse );
					}
				);
		} );

		it( 'should return a promise that rejects if Transifex returned an error (delay)', async () => {
			const apiResponse = new Error( 'JsonApiError' );

			getResourceStringsAsyncUploadMock.mockResolvedValueOnce( {
				attributes: { status: 'processing' }
			} );
			getResourceStringsAsyncUploadMock.mockRejectedValueOnce( apiResponse );

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( apiResponse );
					}
				);

			expect( promise ).toBeInstanceOf( Promise );

			await vi.advanceTimersByTimeAsync( 3000 );

			return promise;
		} );

		it( 'should return a promise that rejects if reached the maximum number of requests to Transifex', async () => {
			// 10 is equal to the `MAX_REQUEST_ATTEMPTS` constant.
			for ( let i = 0; i < 10; ++i ) {
				getResourceStringsAsyncUploadMock.mockResolvedValueOnce( {
					attributes: { status: 'processing' }
				} );
			}

			const promise = transifexService.getResourceUploadDetails( '4abfc726-6a27-4c33-9d99-e5254c8df748' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					err => {
						expect( err ).toEqual( {
							errors: [
								{
									detail: 'Failed to retrieve the upload details.'
								}
							]
						} );
					}
				);

			expect( promise ).toBeInstanceOf( Promise );

			for ( let i = 0; i < 9; ++i ) {
				expect(
					getResourceStringsAsyncUploadMock, `getResourceStringsAsyncUpload, call: ${ i + 1 }`
				).toHaveBeenCalledTimes( i + 1 );

				await vi.advanceTimersByTimeAsync( 3000 );
			}

			return promise;
		} );
	} );
} );

function resourceAsyncDownloadMockFactory() {
	return {
		create: vi.fn().mockImplementation( ( { attributes, relationships, type } ) => {
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
}
