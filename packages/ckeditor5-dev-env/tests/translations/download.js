/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const path = require( 'path' );
const mockery = require( 'mockery' );

describe( 'download', () => {
	let sandbox, stubs, download, resources, resourcesDetails, translations, fileContents;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

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

		sandbox.stub( process, 'cwd', () => 'workspace' );

		mockery.registerMock( './languagecodemap.json', { 'en_AU': 'en-au' } );
		mockery.registerMock( 'del', stubs.del );
		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			translations: stubs.translationUtils,
			logger: () => stubs.logger
		} );
		mockery.registerMock( 'path', stubs.path );
		mockery.registerMock( './transifex-service', stubs.transifexService );

		download = require( '../../lib/translations/download' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should download translations', () => {
		resources = [
			{ slug: 'ckeditor5-core' },
			{ slug: 'ckeditor5-ui' },
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

		return download( {
			username: 'username',
			password: 'password'
		} ).then( test );

		function test() {
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
		}
	} );
} );
