/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const { expect } = require( 'chai' );

describe( 'dev-env/translations/download()', () => {
	let stubs, mocks, download;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				info: sinon.stub(),
				warning: sinon.stub(),
				error: sinon.stub()
			},

			fs: {
				outputFileSync: sinon.stub(),
				removeSync: sinon.stub()
			},

			translationUtils: {
				createDictionaryFromPoFileContent: sinon.stub().callsFake( fileContent => mocks.fileContents[ fileContent ] ),
				cleanPoFileContent: sinon.stub().callsFake( fileContent => fileContent )
			},

			transifexService: {
				init: sinon.stub(),

				getResourceName: sinon.stub().callsFake( resource => resource.attributes.slug ),

				getProjectData: sinon.stub().callsFake( localizablePackageNames => {
					const projectData = {
						resources: mocks.resources.filter( resource => localizablePackageNames.includes( resource.attributes.slug ) ),
						languages: [ ...mocks.languages ]
					};

					return Promise.resolve( projectData );
				} ),

				getTranslations: sinon.stub().callsFake( ( resource, languages ) => {
					const translations = languages.map( language => [
						language.attributes.code,
						mocks.translations[ resource.attributes.slug ][ language.attributes.code ]
					] );

					return Promise.resolve( new Map( translations ) );
				} )
			}
		};

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			translations: stubs.translationUtils,
			logger: () => stubs.logger
		} );

		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( './transifex-service-for-api-v3.0', stubs.transifexService );
		mockery.registerMock( './languagecodemap.json', { ne_NP: 'ne' } );

		download = require( '../../lib/translations/download' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
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
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ]
			] )
		} );

		sinon.assert.calledOnce( stubs.fs.removeSync );
		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly( stubs.fs.removeSync, path.normalize( '/workspace/foo/ckeditor5-core/lang/translations' ) );
		sinon.assert.callOrder( stubs.fs.removeSync, stubs.fs.outputFileSync );
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
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		sinon.assert.callCount( stubs.fs.outputFileSync, 3 );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
			'ckeditor5-core-pl-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/de.po' ),
			'ckeditor5-core-de-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.normalize( '/workspace/bar/ckeditor5-ui/lang/translations/pl.po' ),
			'ckeditor5-ui-pl-content'
		);
	} );

	it( 'should skip creating a resource with no translations', async () => {
		mocks = {
			resources: [],
			languages: [],
			translations: {},
			fileContents: {}
		};

		await download( {
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-non-existing', 'foo/ckeditor5-non-existing' ]
			] )
		} );

		sinon.assert.notCalled( stubs.fs.removeSync );
		sinon.assert.notCalled( stubs.fs.outputFileSync );
	} );

	it( 'should use the language code from the languagecodemap.json if it exists, or the default language code otherwise', async () => {
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
			cwd: '/workspace',
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ]
			] )
		} );

		sinon.assert.callCount( stubs.fs.outputFileSync, 3 );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/pl.po' ),
			'ckeditor5-core-pl-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/en_AU.po' ),
			'ckeditor5-core-en_AU-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.normalize( '/workspace/foo/ckeditor5-core/lang/translations/ne.po' ),
			'ckeditor5-core-ne_NP-content'
		);
	} );

	it( 'should fail with an error when the transifex service responses with an error', async () => {
		const error = new Error( 'An example error.' );

		stubs.transifexService.getProjectData.rejects( error );

		try {
			await download( {
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

	it( 'should fail with an error describing missing properties if the required were not passed to the function', async () => {
		try {
			await download( {} );
		} catch ( err ) {
			expect( err.message ).to.equal( 'The specified object misses the following properties: token, packages, cwd.' );
		}
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
} );
