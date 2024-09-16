/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import download from '../lib/download.js';

const {
	fsOutputFileSyncMock,
	fsRemoveSyncMock,
	fsExistsSyncMock,
	fsReadJsonSyncMock,
	fsWriteJsonSyncMock,
	chalkGrayMock,
	chalkUnderlineMock,
	toolsCreateSpinnerMock,
	cleanPoFileContentMock,
	createDictionaryFromPoFileContentMock,
	transifexInitMock,
	transifexGetResourceNameMock,
	transifexGetLanguageCodeMock,
	transifexGetProjectDataMock,
	transifexGetTranslationsMock,
	utilsVerifyPropertiesMock,
	utilsCreateLoggerMock
} = vi.hoisted( () => {
	return {
		fsOutputFileSyncMock: vi.fn(),
		fsRemoveSyncMock: vi.fn(),
		fsExistsSyncMock: vi.fn(),
		fsReadJsonSyncMock: vi.fn(),
		fsWriteJsonSyncMock: vi.fn(),
		chalkGrayMock: vi.fn(),
		chalkUnderlineMock: vi.fn(),
		toolsCreateSpinnerMock: vi.fn(),
		cleanPoFileContentMock: vi.fn(),
		createDictionaryFromPoFileContentMock: vi.fn(),
		transifexInitMock: vi.fn(),
		transifexGetResourceNameMock: vi.fn(),
		transifexGetLanguageCodeMock: vi.fn(),
		transifexGetProjectDataMock: vi.fn(),
		transifexGetTranslationsMock: vi.fn(),
		utilsVerifyPropertiesMock: vi.fn(),
		utilsCreateLoggerMock: vi.fn()
	};
} );

vi.mock( 'fs-extra', () => {
	return {
		default: {
			outputFileSync: fsOutputFileSyncMock,
			removeSync: fsRemoveSyncMock,
			existsSync: fsExistsSyncMock,
			readJsonSync: fsReadJsonSyncMock,
			writeJsonSync: fsWriteJsonSyncMock
		}
	};
} );

vi.mock( 'chalk', () => {
	return {
		default: {
			gray: chalkGrayMock,
			underline: chalkUnderlineMock
		}
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => {
	return {
		tools: {
			createSpinner: toolsCreateSpinnerMock
		}
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-translations', () => {
	return {
		cleanPoFileContent: cleanPoFileContentMock,
		createDictionaryFromPoFileContent: createDictionaryFromPoFileContentMock
	};
} );

vi.mock( '../lib/transifexservice.js', () => {
	return {
		default: {
			init: transifexInitMock,
			getResourceName: transifexGetResourceNameMock,
			getLanguageCode: transifexGetLanguageCodeMock,
			getProjectData: transifexGetProjectDataMock,
			getTranslations: transifexGetTranslationsMock
		}
	};
} );

vi.mock( '../lib/utils.js', () => {
	return {
		verifyProperties: utilsVerifyPropertiesMock,
		createLogger: utilsCreateLoggerMock
	};
} );

vi.mock( '../lib/languagecodemap.json', () => {
	return {
		default: {
			ne_NP: 'ne'
		}
	};
} );

describe( 'dev-transifex/download()', () => {
	let mocks;
	let loggerProgressMock, loggerInfoMock, loggerWarningMock, loggerErrorMock, loggerLogMock;
	let spinnerStartMock, spinnerFinishMock;

	beforeEach( () => {
		loggerProgressMock = vi.fn();
		loggerInfoMock = vi.fn();
		loggerWarningMock = vi.fn();
		loggerErrorMock = vi.fn();
		loggerErrorMock = vi.fn();

		vi.mocked( utilsCreateLoggerMock ).mockImplementation( () => {
			return {
				progress: loggerProgressMock,
				info: loggerInfoMock,
				warning: loggerWarningMock,
				error: loggerErrorMock,
				_log: loggerLogMock
			};
		} );

		spinnerStartMock = vi.fn();
		spinnerFinishMock = vi.fn();

		vi.mocked( toolsCreateSpinnerMock ).mockReturnValue( {
			start: spinnerStartMock,
			finish: spinnerFinishMock
		} );

		// 	existsSync: sinon.stub()
		// 		.withArgs( path.normalize( '/workspace/.transifex-failed-downloads.json' ) )
		// 		.callsFake( () => Boolean( mocks.oldFailedDownloads ) ),

		// 	readJsonSync: sinon.stub()
		// 		.withArgs( path.normalize( '/workspace/.transifex-failed-downloads.json' ) )
		// 		.callsFake( () => mocks.oldFailedDownloads ),

		vi.mocked( fsExistsSyncMock ).mockImplementation( () => Boolean( mocks.oldFailedDownloads ) );
		vi.mocked( fsReadJsonSyncMock ).mockImplementation( () => mocks.oldFailedDownloads );

		vi.mocked( createDictionaryFromPoFileContentMock ).mockImplementation( fileContent => mocks.fileContents[ fileContent ] );
		vi.mocked( cleanPoFileContentMock ).mockImplementation( fileContent => fileContent );

		vi.mocked( chalkUnderlineMock ).mockImplementation( string => string );
		vi.mocked( chalkGrayMock ).mockImplementation( string => string );

		vi.mocked( transifexGetResourceNameMock ).mockImplementation( resource => resource.attributes.slug );
		vi.mocked( transifexGetLanguageCodeMock ).mockImplementation( language => language.attributes.code );
		vi.mocked( transifexGetProjectDataMock ).mockImplementation( ( organizationName, projectName, localizablePackageNames ) => {
			const projectData = {
				resources: mocks.resources.filter( resource => localizablePackageNames.includes( resource.attributes.slug ) ),
				languages: mocks.languages
			};

			return Promise.resolve( projectData );
		} );
		vi.mocked( transifexGetTranslationsMock ).mockImplementation( ( resource, languages ) => {
			const translationData = {
				translations: new Map(
					languages.map( language => [
						language.attributes.code,
						mocks.translations[ resource.attributes.slug ][ language.attributes.code ]
					] )
				),
				failedDownloads: mocks.newFailedDownloads ?
					mocks.newFailedDownloads.filter( item => {
						const isResourceNameMatched = item.resourceName === resource.attributes.slug;
						const isLanguageCodeMatched = languages.find( language => item.languageCode === language.attributes.code );

						return isResourceNameMatched && isLanguageCodeMatched;
					} ) :
					[]
			};

			return Promise.resolve( translationData );
		} );
	} );

	it( 'should fail if properties verification failed', () => {
		const error = new Error( 'The specified object misses the following properties: packages.' );
		const config = {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken'
		};

		vi.mocked( utilsVerifyPropertiesMock ).mockImplementation( () => {
			throw new Error( error );
		} );

		return download( config )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				caughtError => {
					expect( caughtError.message.endsWith( error.message ) ).toEqual( true );

					expect( vi.mocked( utilsVerifyPropertiesMock ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( utilsVerifyPropertiesMock ) ).toHaveBeenCalledWith(
						config, [ 'organizationName', 'projectName', 'token', 'packages', 'cwd' ]
					);
				}
			);
	} );

	it( 'should remove translations before downloading', async () => {
		mocks = {
			resources: [
				{ attributes: { slug: 'ckeditor5-core' } }
			],
			languages: [
				{ attributes: { code: 'pl' } }
			],
			translations: {
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' }
			}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ]
			] )
		} );

		expect( vi.mocked( fsRemoveSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );

		expect( vi.mocked( fsRemoveSyncMock ) ).toHaveBeenNthCalledWith(
			1,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations' )
		);
		expect( vi.mocked( fsRemoveSyncMock ) ).toHaveBeenNthCalledWith(
			2,
			path.normalize( '/workspace/.transifex-failed-downloads.json' )
		);
	} );

	it( 'should download translations for non-empty resources', async () => {
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
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content',
					de: 'ckeditor5-core-de-content'
				},
				'ckeditor5-ui': {
					pl: 'ckeditor5-ui-pl-content',
					de: 'ckeditor5-ui-de-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' },
				'ckeditor5-core-de-content': { save: 'save_de' },
				'ckeditor5-ui-pl-content': { cancel: 'cancel_pl' },
				'ckeditor5-ui-de-content': {}
			}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 3 );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			1,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
			'ckeditor5-core-pl-content'
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			2,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/de.po' ),
			'ckeditor5-core-de-content'
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			3,
			path.normalize( '/workspace/bar/ckeditor5-ui/lang/translations/pl.po' ),
			'ckeditor5-ui-pl-content'
		);

		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith(
			1, 'Fetching project information...'
		);
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith(
			2, 'Downloading all translations...'
		);
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith(
			3, 'Saved all translations.'
		);

		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenNthCalledWith(
			1, '      Saved 2 "*.po" file(s).'
		);
		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenNthCalledWith(
			2, '      Saved 1 "*.po" file(s).'
		);
	} );

	it( 'should download translations for non-empty resources only for specified packages', async () => {
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
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content',
					de: 'ckeditor5-core-de-content'
				},
				'ckeditor5-ui': {
					pl: 'ckeditor5-ui-pl-content',
					de: 'ckeditor5-ui-de-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' },
				'ckeditor5-core-de-content': { save: 'save_de' },
				'ckeditor5-ui-pl-content': { cancel: 'cancel_pl' },
				'ckeditor5-ui-de-content': {}
			}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
			path.normalize( '/workspace/bar/ckeditor5-ui/lang/translations/pl.po' ),
			'ckeditor5-ui-pl-content'
		);
	} );

	it( 'should create spinner for each processed package', async () => {
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
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content',
					de: 'ckeditor5-core-de-content'
				},
				'ckeditor5-ui': {
					pl: 'ckeditor5-ui-pl-content',
					de: 'ckeditor5-ui-de-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' },
				'ckeditor5-core-de-content': { save: 'save_de' },
				'ckeditor5-ui-pl-content': { cancel: 'cancel_pl' },
				'ckeditor5-ui-de-content': {}
			}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( spinnerStartMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( spinnerFinishMock ) ).toHaveBeenCalledTimes( 2 );

		expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenNthCalledWith(
			1,
			'Processing "ckeditor5-core"...',
			{ indentLevel: 1, emoji: '👉' }
		);

		expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenNthCalledWith(
			2,
			'Processing "ckeditor5-ui"...',
			{ indentLevel: 1, emoji: '👉' }
		);
	} );

	it( 'should skip creating a translation file if there are no resources', async () => {
		mocks = {
			resources: [],
			languages: [],
			translations: {},
			fileContents: {}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-non-existing', 'foo/ckeditor5-non-existing' ]
			] )
		} );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should save failed downloads', async () => {
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
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content',
					de: 'ckeditor5-core-de-content'
				},
				'ckeditor5-ui': {
					pl: 'ckeditor5-ui-pl-content',
					de: 'ckeditor5-ui-de-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' },
				'ckeditor5-core-de-content': { save: 'save_de' },
				'ckeditor5-ui-pl-content': { cancel: 'cancel_pl' },
				'ckeditor5-ui-de-content': { cancel: 'cancel_de' }
			},
			newFailedDownloads: [
				{ resourceName: 'ckeditor5-ui', languageCode: 'de', errorMessage: 'An example error.' }
			]
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		expect( vi.mocked( fsWriteJsonSyncMock ) ).toHaveBeenCalledTimes( 1 );

		expect( vi.mocked( fsWriteJsonSyncMock ) ).toHaveBeenCalledWith(
			path.normalize( '/workspace/.transifex-failed-downloads.json' ),
			[ { resourceName: 'ckeditor5-ui', languages: [ { code: 'de', errorMessage: 'An example error.' } ] } ],
			{ spaces: 2 }
		);

		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenNthCalledWith( 1, '      Saved 2 "*.po" file(s).' );
		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenNthCalledWith( 2, '      Saved 2 "*.po" file(s). 1 requests failed.' );

		expect( vi.mocked( loggerWarningMock ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
			1,
			'Not all translations were downloaded due to errors in Transifex API.'
		);
		expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
			2,
			`Review the "${ path.normalize( '/workspace/.transifex-failed-downloads.json' ) }" file for more details.`
		);
		expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
			3,
			'Re-running the script will process only packages specified in the file.'
		);

		expect( vi.mocked( spinnerFinishMock ) ).toHaveBeenCalledTimes( 2 );
		// First call: OK. Second call: error.
		expect( vi.mocked( spinnerFinishMock ) ).toHaveBeenNthCalledWith( 1 );
		expect( vi.mocked( spinnerFinishMock ) ).toHaveBeenNthCalledWith( 2, { emoji: '❌' } );
	} );

	it( 'should use the language code from the "languagecodemap.json" if it exists, or the default language code otherwise', async () => {
		mocks = {
			resources: [
				{ attributes: { slug: 'ckeditor5-core' } }
			],
			languages: [
				{ attributes: { code: 'pl' } },
				{ attributes: { code: 'en_AU' } },
				{ attributes: { code: 'ne_NP' } }
			],
			translations: {
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content',
					en_AU: 'ckeditor5-core-en_AU-content',
					ne_NP: 'ckeditor5-core-ne_NP-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' },
				'ckeditor5-core-en_AU-content': { save: 'save_en_AU' },
				'ckeditor5-core-ne_NP-content': { save: 'save_ne_NP' }
			}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ]
			] )
		} );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 3 );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			1,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
			'ckeditor5-core-pl-content'
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			2,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/en_AU.po' ),
			'ckeditor5-core-en_AU-content'
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			3,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/ne.po' ),
			'ckeditor5-core-ne_NP-content'
		);
	} );

	it( 'should fail with an error when the transifex service responses with an error', async () => {
		const error = new Error( 'An example error.' );

		vi.mocked( transifexGetProjectDataMock ).mockRejectedValue( error );

		try {
			await download( {
				organizationName: 'ckeditor-organization',
				projectName: 'ckeditor5-project',
				token: 'secretToken',
				cwd: '/workspace',
				packages: new Map( [
					[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
					[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
				] )
			} );
		} catch ( err ) {
			expect( err ).to.equal( error );
		}

		expect( vi.mocked( transifexGetProjectDataMock ) ).toHaveBeenCalled();
	} );

	it( 'should pass the "simplifyLicenseHeader" flag to the "cleanPoFileContent()" function when set to `true`', async () => {
		mocks = {
			resources: [
				{ attributes: { slug: 'ckeditor5-core' } }
			],
			languages: [
				{ attributes: { code: 'pl' } }
			],
			translations: {
				'ckeditor5-core': {
					pl: 'ckeditor5-core-pl-content'
				}
			},
			fileContents: {
				'ckeditor5-core-pl-content': { save: 'save_pl' }
			}
		};

		await download( {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-non-existing', 'foo/ckeditor5-non-existing' ]
			] ),
			simplifyLicenseHeader: true
		} );

		expect( vi.mocked( cleanPoFileContentMock ) ).toHaveBeenCalledTimes( 1 );

		expect( vi.mocked( cleanPoFileContentMock ) ).toHaveBeenCalledWith(
			'ckeditor5-core-pl-content',
			{
				simplifyLicenseHeader: true
			}
		);
	} );

	describe( 'recovery mode with existing ".transifex-failed-downloads.json" file', () => {
		it( 'should not remove any translations beforehand', async () => {
			mocks = {
				resources: [
					{ attributes: { slug: 'ckeditor5-core' } }
				],
				languages: [
					{ attributes: { code: 'pl' } }
				],
				translations: {
					'ckeditor5-core': {
						pl: 'ckeditor5-core-pl-content'
					}
				},
				fileContents: {
					'ckeditor5-core-pl-content': { save: 'save_pl' }
				},
				oldFailedDownloads: [
					{ resourceName: 'ckeditor5-core', languages: [ { code: 'pl' } ] }
				]
			};

			await download( {
				organizationName: 'ckeditor-organization',
				projectName: 'ckeditor5-project',
				cwd: '/workspace',
				token: 'secretToken',
				packages: new Map( [
					[ 'ckeditor5-core', 'foo/ckeditor5-core' ]
				] )
			} );

			expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fsRemoveSyncMock ) ).toHaveBeenCalledTimes( 1 );

			expect( vi.mocked( fsRemoveSyncMock ) ).toHaveBeenCalledWith(
				path.normalize( '/workspace/.transifex-failed-downloads.json' )
			);
		} );

		it( 'should download translations for existing resources but only for previously failed ones', async () => {
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
					'ckeditor5-core': {
						pl: 'ckeditor5-core-pl-content',
						de: 'ckeditor5-core-de-content'
					},
					'ckeditor5-ui': {
						pl: 'ckeditor5-ui-pl-content',
						de: 'ckeditor5-ui-de-content'
					}
				},
				fileContents: {
					'ckeditor5-core-pl-content': { save: 'save_pl' },
					'ckeditor5-core-de-content': { save: 'save_de' },
					'ckeditor5-ui-pl-content': { cancel: 'cancel_pl' },
					'ckeditor5-ui-de-content': { cancel: 'cancel_de' }
				},
				oldFailedDownloads: [
					{ resourceName: 'ckeditor5-core', languages: [ { code: 'pl' } ] },
					{ resourceName: 'ckeditor5-non-existing', languages: [ { code: 'de' } ] }
				]
			};

			await download( {
				organizationName: 'ckeditor-organization',
				projectName: 'ckeditor5-project',
				cwd: '/workspace',
				token: 'secretToken',
				packages: new Map( [
					[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
					[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
				] )
			} );

			expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );

			expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
				path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
				'ckeditor5-core-pl-content'
			);

			expect( loggerWarningMock ).toHaveBeenCalledTimes( 2 );
			expect( loggerWarningMock ).toHaveBeenNthCalledWith(
				1,
				'Found the file containing a list of packages that failed during the last script execution.'
			);
			expect( loggerWarningMock ).toHaveBeenNthCalledWith(
				2,
				'The script will process only packages listed in the file instead of all passed as "config.packages".'
			);

			expect( loggerProgressMock ).toHaveBeenCalledTimes( 3 );
			expect( loggerProgressMock ).toHaveBeenNthCalledWith( 1, 'Fetching project information...' );
			expect( loggerProgressMock ).toHaveBeenNthCalledWith( 2, 'Downloading only translations that failed previously...' );
			expect( loggerProgressMock ).toHaveBeenNthCalledWith( 3, 'Saved all translations.' );
		} );

		it( 'should update ".transifex-failed-downloads.json" file if there are still some failed downloads', async () => {
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
					'ckeditor5-core': {
						pl: 'ckeditor5-core-pl-content',
						de: 'ckeditor5-core-de-content'
					},
					'ckeditor5-ui': {
						pl: 'ckeditor5-ui-pl-content',
						de: 'ckeditor5-ui-de-content'
					}
				},
				fileContents: {
					'ckeditor5-core-pl-content': { save: 'save_pl' },
					'ckeditor5-core-de-content': { save: 'save_de' },
					'ckeditor5-ui-pl-content': { cancel: 'cancel_pl' },
					'ckeditor5-ui-de-content': {}
				},
				oldFailedDownloads: [
					{ resourceName: 'ckeditor5-core', languages: [ { code: 'pl' }, { code: 'de' } ] },
					{ resourceName: 'ckeditor5-non-existing', languages: [ { code: 'de' } ] }
				],
				newFailedDownloads: [
					{ resourceName: 'ckeditor5-core', languageCode: 'de', errorMessage: 'An example error.' }
				]
			};

			await download( {
				organizationName: 'ckeditor-organization',
				projectName: 'ckeditor5-project',
				cwd: '/workspace',
				token: 'secretToken',
				packages: new Map( [
					[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
					[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
				] )
			} );

			expect( vi.mocked( fsWriteJsonSyncMock ) ).toHaveBeenCalledTimes( 1 );

			expect( vi.mocked( fsWriteJsonSyncMock ) ).toHaveBeenCalledWith(
				path.normalize( '/workspace/.transifex-failed-downloads.json' ),
				[ { resourceName: 'ckeditor5-core', languages: [ { code: 'de', errorMessage: 'An example error.' } ] } ],
				{ spaces: 2 }
			);
		} );
	} );
} );
