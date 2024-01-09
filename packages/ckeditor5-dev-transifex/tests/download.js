/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const { expect } = require( 'chai' );

describe( 'dev-transifex/download()', () => {
	let stubs, mocks, download;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				progress: sinon.stub(),
				info: sinon.stub(),
				warning: sinon.stub(),
				error: sinon.stub(),
				_log: sinon.stub()
			},

			fs: {
				outputFileSync: sinon.stub(),

				removeSync: sinon.stub(),

				existsSync: sinon.stub()
					.withArgs( path.normalize( '/workspace/.transifex-failed-downloads.json' ) )
					.callsFake( () => Boolean( mocks.oldFailedDownloads ) ),

				readJsonSync: sinon.stub()
					.withArgs( path.normalize( '/workspace/.transifex-failed-downloads.json' ) )
					.callsFake( () => mocks.oldFailedDownloads ),

				writeJsonSync: sinon.stub()
			},

			translationUtils: {
				createDictionaryFromPoFileContent: sinon.stub().callsFake( fileContent => mocks.fileContents[ fileContent ] ),
				cleanPoFileContent: sinon.stub().callsFake( fileContent => fileContent )
			},

			chalk: {
				underline: sinon.stub().callsFake( msg => msg ),
				gray: sinon.stub().callsFake( msg => msg )
			},

			tools: {
				createSpinner: sinon.stub(),
				spinnerStart: sinon.stub(),
				spinnerFinish: sinon.stub()
			},

			transifexService: {
				init: sinon.stub(),

				getResourceName: sinon.stub().callsFake( resource => resource.attributes.slug ),

				getLanguageCode: sinon.stub().callsFake( language => language.attributes.code ),

				getProjectData: sinon.stub().callsFake( ( organizationName, projectName, localizablePackageNames ) => {
					const projectData = {
						resources: mocks.resources.filter( resource => localizablePackageNames.includes( resource.attributes.slug ) ),
						languages: mocks.languages
					};

					return Promise.resolve( projectData );
				} ),

				getTranslations: sinon.stub().callsFake( ( resource, languages ) => {
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
				} )
			},

			utils: {
				verifyProperties: sinon.stub(),
				createLogger: sinon.stub()
			}
		};

		stubs.tools.createSpinner.returns( {
			start: stubs.tools.spinnerStart,
			finish: stubs.tools.spinnerFinish
		} );

		stubs.utils.createLogger.returns( {
			progress: stubs.logger.progress,
			info: stubs.logger.info,
			warning: stubs.logger.warning,
			error: stubs.logger.error,
			_log: sinon.stub()
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			tools: stubs.tools
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-translations', {
			cleanPoFileContent: stubs.translationUtils.cleanPoFileContent,
			createDictionaryFromPoFileContent: stubs.translationUtils.createDictionaryFromPoFileContent
		} );

		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( 'chalk', stubs.chalk );
		mockery.registerMock( './transifexservice', stubs.transifexService );
		mockery.registerMock( './utils', stubs.utils );
		mockery.registerMock( './languagecodemap.json', { ne_NP: 'ne' } );

		download = require( '../lib/download' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	it( 'should fail if properties verification failed', () => {
		const error = new Error( 'The specified object misses the following properties: packages.' );
		const config = {
			organizationName: 'ckeditor-organization',
			projectName: 'ckeditor5-project',
			cwd: '/workspace',
			token: 'secretToken'
		};

		stubs.utils.verifyProperties.throws( error );

		return download( config )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				err => {
					expect( err ).to.equal( error );

					expect( stubs.utils.verifyProperties.callCount ).to.equal( 1 );
					expect( stubs.utils.verifyProperties.firstCall.args[ 0 ] ).to.deep.equal( config );
					expect( stubs.utils.verifyProperties.firstCall.args[ 1 ] ).to.deep.equal( [
						'organizationName',
						'projectName',
						'token',
						'packages',
						'cwd'
					] );
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

		sinon.assert.calledTwice( stubs.fs.removeSync );
		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.removeSync.firstCall,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations' )
		);

		sinon.assert.calledWithExactly(
			stubs.fs.removeSync.secondCall,
			path.normalize( '/workspace/.transifex-failed-downloads.json' )
		);

		expect( stubs.fs.removeSync.firstCall.calledBefore( stubs.fs.outputFileSync.firstCall ) ).to.be.true;
		expect( stubs.fs.removeSync.secondCall.calledAfter( stubs.fs.outputFileSync.firstCall ) ).to.be.true;
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

		sinon.assert.callCount( stubs.fs.outputFileSync, 3 );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync.firstCall,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
			'ckeditor5-core-pl-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync.secondCall,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/de.po' ),
			'ckeditor5-core-de-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync.thirdCall,
			path.normalize( '/workspace/bar/ckeditor5-ui/lang/translations/pl.po' ),
			'ckeditor5-ui-pl-content'
		);

		sinon.assert.callCount( stubs.logger.progress, 3 );
		sinon.assert.calledWithExactly( stubs.logger.progress.firstCall, 'Fetching project information...' );
		sinon.assert.calledWithExactly( stubs.logger.progress.secondCall, 'Downloading all translations...' );
		sinon.assert.calledWithExactly( stubs.logger.progress.thirdCall, 'Saved all translations.' );

		sinon.assert.callCount( stubs.logger.info, 2 );
		sinon.assert.calledWithExactly( stubs.logger.info.firstCall, '      Saved 2 "*.po" file(s).' );
		sinon.assert.calledWithExactly( stubs.logger.info.secondCall, '      Saved 1 "*.po" file(s).' );
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

		sinon.assert.callCount( stubs.fs.outputFileSync, 1 );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
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

		sinon.assert.callCount( stubs.tools.createSpinner, 2 );
		sinon.assert.callCount( stubs.tools.spinnerStart, 2 );
		sinon.assert.callCount( stubs.tools.spinnerFinish, 2 );

		sinon.assert.calledWithExactly(
			stubs.tools.createSpinner.firstCall,
			'Processing "ckeditor5-core"...',
			{ indentLevel: 1, emoji: '👉' }
		);

		sinon.assert.calledWithExactly(
			stubs.tools.createSpinner.secondCall,
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

		sinon.assert.notCalled( stubs.fs.outputFileSync );
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

		sinon.assert.calledOnce( stubs.fs.writeJsonSync );

		sinon.assert.calledWithExactly(
			stubs.fs.writeJsonSync,
			path.normalize( '/workspace/.transifex-failed-downloads.json' ),
			[ { resourceName: 'ckeditor5-ui', languages: [ { code: 'de', errorMessage: 'An example error.' } ] } ],
			{ spaces: 2 }
		);

		sinon.assert.callCount( stubs.logger.info, 2 );
		sinon.assert.calledWithExactly( stubs.logger.info.firstCall, '      Saved 2 "*.po" file(s).' );
		sinon.assert.calledWithExactly( stubs.logger.info.secondCall, '      Saved 2 "*.po" file(s). 1 requests failed.' );

		sinon.assert.callCount( stubs.logger.warning, 3 );
		sinon.assert.calledWithExactly(
			stubs.logger.warning.firstCall,
			'Not all translations were downloaded due to errors in Transifex API.'
		);
		sinon.assert.calledWithExactly(
			stubs.logger.warning.secondCall,
			`Review the "${ path.normalize( '/workspace/.transifex-failed-downloads.json' ) }" file for more details.`
		);
		sinon.assert.calledWithExactly(
			stubs.logger.warning.thirdCall,
			'Re-running the script will process only packages specified in the file.'
		);

		sinon.assert.callCount( stubs.tools.spinnerFinish, 2 );
		// First call: OK. Second call: error.
		sinon.assert.calledWithExactly( stubs.tools.spinnerFinish );
		sinon.assert.calledWithExactly( stubs.tools.spinnerFinish, { emoji: '❌' } );
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

		sinon.assert.callCount( stubs.fs.outputFileSync, 3 );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync.firstCall,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
			'ckeditor5-core-pl-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync.secondCall,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/en_AU.po' ),
			'ckeditor5-core-en_AU-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync.thirdCall,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/ne.po' ),
			'ckeditor5-core-ne_NP-content'
		);
	} );

	it( 'should fail with an error when the transifex service responses with an error', async () => {
		const error = new Error( 'An example error.' );

		stubs.transifexService.getProjectData.rejects( error );

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

		expect( stubs.transifexService.getProjectData.called ).to.equal( true );
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

		sinon.assert.calledOnce( stubs.translationUtils.cleanPoFileContent );

		sinon.assert.calledWithExactly(
			stubs.translationUtils.cleanPoFileContent,
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

			sinon.assert.calledOnce( stubs.fs.outputFileSync );
			sinon.assert.calledOnce( stubs.fs.removeSync );

			sinon.assert.calledWithExactly(
				stubs.fs.removeSync,
				path.normalize( '/workspace/.transifex-failed-downloads.json' )
			);

			expect( stubs.fs.removeSync.calledAfter( stubs.fs.outputFileSync ) ).to.be.true;
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

			sinon.assert.callCount( stubs.fs.outputFileSync, 1 );

			sinon.assert.calledWithExactly(
				stubs.fs.outputFileSync,
				path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
				'ckeditor5-core-pl-content'
			);

			sinon.assert.callCount( stubs.logger.warning, 2 );
			sinon.assert.calledWithExactly(
				stubs.logger.warning.firstCall,
				'Found the file containing a list of packages that failed during the last script execution.'
			);
			sinon.assert.calledWithExactly(
				stubs.logger.warning.secondCall,
				'The script will process only packages listed in the file instead of all passed as "config.packages".'
			);

			sinon.assert.callCount( stubs.logger.progress, 3 );
			sinon.assert.calledWithExactly( stubs.logger.progress.firstCall, 'Fetching project information...' );
			sinon.assert.calledWithExactly( stubs.logger.progress.secondCall, 'Downloading only translations that failed previously...' );
			sinon.assert.calledWithExactly( stubs.logger.progress.thirdCall, 'Saved all translations.' );
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

			sinon.assert.calledOnce( stubs.fs.writeJsonSync );

			sinon.assert.calledWithExactly(
				stubs.fs.writeJsonSync,
				path.normalize( '/workspace/.transifex-failed-downloads.json' ),
				[ { resourceName: 'ckeditor5-core', languages: [ { code: 'de', errorMessage: 'An example error.' } ] } ],
				{ spaces: 2 }
			);
		} );
	} );
} );
