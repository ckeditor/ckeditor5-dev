/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const path = require( 'path' );
const mockery = require( 'mockery' );
const { expect } = require( 'chai' );

describe( 'download', () => {
	let stubs, download, resources, resourcesDetails, translations, fileContents;

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
				outputFileSync: sinon.spy(),
				removeSync: sinon.spy()
			},

			translationUtils: {
				createDictionaryFromPoFileContent: sinon.spy( poFileContent => fileContents[ poFileContent ] ),
				cleanPoFileContent: x => x
			},

			transifexService: {
				getResources: sinon.spy( () => Promise.resolve( resources ) ),
				getResourceDetails: sinon.spy( ( { slug } ) => Promise.resolve( resourcesDetails[ slug ] ) ),
				getTranslation: sinon.spy( ( { lang, slug } ) => Promise.resolve( translations[ slug ][ lang ] ) )
			}
		};

		sinon.stub( process, 'cwd' ).returns( 'workspace' );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			translations: stubs.translationUtils,
			logger: () => stubs.logger
		} );

		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( './transifex-service', stubs.transifexService );

		download = require( '../../lib/translations/download' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	it( 'should remove translations before downloading', async () => {
		mockery.registerMock( './languagecodemap.json', {} );

		resources = [
			{ slug: 'ckeditor5-core' }
		];

		resourcesDetails = {
			'ckeditor5-core': {
				available_languages: [ {
					code: 'pl'
				} ]
			}
		};

		translations = {
			'ckeditor5-core': {
				pl: { content: 'ckeditor5-core-pl-content' }
			}
		};

		fileContents = {
			'ckeditor5-core-pl-content': { save: 'save_pl' }
		};

		await download( {
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ]
			] )
		} );

		sinon.assert.calledOnce( stubs.fs.removeSync );
		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.removeSync,
			path.join( 'workspace', 'foo', 'ckeditor5-core', 'lang', 'translations' )
		);

		sinon.assert.callOrder(
			stubs.fs.removeSync,
			stubs.fs.outputFileSync
		);
	} );

	it( 'should download translations for non-empty resources', async () => {
		mockery.registerMock( './languagecodemap.json', {} );

		resources = [
			{ slug: 'ckeditor5-core' },
			{ slug: 'ckeditor5-ui' }
		];

		resourcesDetails = {
			'ckeditor5-core': {
				available_languages: [ {
					code: 'pl'
				} ]
			},
			'ckeditor5-ui': {
				available_languages: [ {
					code: 'de'
				} ]
			}
		};

		translations = {
			'ckeditor5-core': {
				pl: { content: 'ckeditor5-core-pl-content' }
			},
			'ckeditor5-ui': {
				de: { content: 'ckeditor5-ui-de-content' }
			}
		};

		fileContents = {
			'ckeditor5-core-pl-content': { save: 'save_pl' },
			'ckeditor5-ui-de-content': { cancel: 'cancel_de' }
		};

		await download( {
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		sinon.assert.calledTwice( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'workspace', 'foo', 'ckeditor5-core', 'lang', 'translations', 'pl.po' ),
			'ckeditor5-core-pl-content'
		);

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'workspace', 'bar', 'ckeditor5-ui', 'lang', 'translations', 'de.po' ),
			'ckeditor5-ui-de-content'
		);
	} );

	it( 'should skip creating a resource with no translations', () => {
		mockery.registerMock( './languagecodemap.json', {} );

		resources = [
			{ slug: 'ckeditor5-core' }
		];

		resourcesDetails = {
			'ckeditor5-core': {
				available_languages: [ {
					code: 'pl'
				} ]
			}
		};

		translations = {
			'ckeditor5-core': {
				pl: { content: 'ckeditor5-core-pl-content' }
			}
		};

		fileContents = {
			'ckeditor5-core-pl-content': { save: 'save_pl' }
		};

		// TODO: Should it be called? It's rather a rare case anyway.
		sinon.assert.notCalled( stubs.fs.removeSync );

		sinon.assert.notCalled( stubs.fs.outputFileSync );
	} );

	it( 'should use the default language codes when the codes are missing in the languagecodemap.json file', async () => {
		mockery.registerMock( './languagecodemap.json', {} );

		resources = [
			{ slug: 'ckeditor5-core' },
			{ slug: 'ckeditor5-ui' }
		];

		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		resourcesDetails = {
			'ckeditor5-core': {
				available_languages: [ {
					code: 'pl'
				} ]
			},
			'ckeditor5-ui': {
				available_languages: [ {
					code: 'en_AU'
				} ]
			}
		};

		translations = {
			'ckeditor5-core': {
				pl: { content: 'ckeditor5-core-pl-content' }
			},
			'ckeditor5-ui': {
				en_AU: { content: 'ckeditor5-ui-en-content' }
			}
		};

		fileContents = {
			'ckeditor5-core-pl-content': {},
			'ckeditor5-ui-en-content': { ui: 'ui' }
		};

		await download( {
			token: 'secretToken',
			packages: new Map( [
				[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
				[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
			] )
		} );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'workspace', 'bar', 'ckeditor5-ui', 'lang', 'translations', 'en_AU.po' ),
			'ckeditor5-ui-en-content'
		);
	} );

	it( 'should fail with an error when the transifex service responses with an error', async () => {
		const error = new Error();

		stubs.transifexService.getResources = sinon.stub().rejects( error );

		try {
			await download( {
				token: 'secretToken',
				packages: new Map( [
					[ 'ckeditor5-core', 'foo/ckeditor5-core' ],
					[ 'ckeditor5-ui', 'bar/ckeditor5-ui' ]
				] )
			} );

			throw new Error( 'Expected method to throw an error.' );
		} catch ( err ) {
			expect( err ).to.equal( error );
		}
	} );
} );
