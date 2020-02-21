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
	let sandbox, stubs, download, resources, resourcesDetails, translations, fileContents;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			del: sandbox.spy( () => Promise.resolve() ),

			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			},

			fs: {
				outputFileSync: sandbox.spy()
			},

			translationUtils: {
				createDictionaryFromPoFileContent: sandbox.spy( poFileContent => fileContents[ poFileContent ] ),
				cleanPoFileContent: x => x
			},

			transifexService: {
				getResources: sandbox.spy( () => Promise.resolve( resources ) ),
				getResourceDetails: sandbox.spy( ( { slug } ) => Promise.resolve( resourcesDetails[ slug ] ) ),
				getTranslation: sandbox.spy( ( { lang, slug	} ) => Promise.resolve( translations[ slug ][ lang ] ) )
			}
		};

		sandbox.stub( process, 'cwd' ).returns( 'workspace' );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			translations: stubs.translationUtils,
			logger: () => stubs.logger
		} );

		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( 'del', stubs.del );
		mockery.registerMock( './transifex-service', stubs.transifexService );

		download = require( '../../lib/translations/download' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should download translations', () => {
		mockery.registerMock( './languagecodemap.json', { 'en_AU': 'en-au' } );

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

		return download( { token: 'secretToken' } )
			.then( () => {
				sinon.assert.calledOnce( stubs.transifexService.getResources );
				sinon.assert.calledTwice( stubs.transifexService.getResourceDetails );
				sinon.assert.calledTwice( stubs.transifexService.getTranslation );
				sinon.assert.calledTwice( stubs.del );
				sinon.assert.calledOnce( stubs.fs.outputFileSync );

				sinon.assert.calledWithExactly(
					stubs.del,
					path.join( 'workspace', 'packages', 'ckeditor5-core', 'lang', 'translations', '**' )
				);

				sinon.assert.calledWithExactly(
					stubs.fs.outputFileSync,
					path.join( 'workspace', 'packages', 'ckeditor5-ui', 'lang', 'translations', 'en-au.po' ),
					'ckeditor5-ui-en-content'
				);
			} );
	} );

	it( 'should use the default language codes when the codes are missing in the languagecodemap.json file', () => {
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

		// jscs:enable requireCamelCaseOrUpperCaseIdentifiers

		return download( { token: 'secretToken' } )
			.then( () => {
				sinon.assert.calledWithExactly(
					stubs.fs.outputFileSync,
					path.join( 'workspace', 'packages', 'ckeditor5-ui', 'lang', 'translations', 'en_AU.po' ),
					'ckeditor5-ui-en-content'
				);
			} );
	} );

	it( 'should report an error when something goes wrong', () => {
		const error = new Error();

		stubs.transifexService.getResources = sandbox.spy( () => Promise.reject( error ) );

		return download( { token: 'secretToken' } )
			.then( () => {
				throw new Error( 'It should throws an error' );
			}, err => {
				expect( err ).to.equal( error );
				sinon.assert.calledOnce( stubs.logger.error );
				sinon.assert.calledWithExactly( stubs.logger.error, error );
			} );
	} );
} );
