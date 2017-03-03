/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const download = require( '../../lib/translations/download' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const transifexService = require( '../../lib/translations/transifex-service' );
const fs = require( 'fs-extra' );
const mockery = require( 'mockery' );
const translationUtils = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

describe( 'download', () => {
	const sandbox = sinon.sandbox.create();
	let deleteSpy;

	beforeEach( () => {
		deleteSpy = sandbox.spy( () => Promise.resolve() );

		mockery.registerMock( './languagecodemap.json', {
			'en_AU': 'en-au'
		} );

		mockery.registerMock( 'del', deleteSpy );

		mockery.enable( {
			warnOnReplace: true,
			warnOnUnregistered: true,
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	it( 'should download translations', () => {
		const resources = [ {
				slug: 'ckeditor5-core'
			},
			{
				slug: 'ckeditor5-ui'
			}
		];

		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		const resourcesDetails = {
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

		const translations = {
			'ckeditor5-core': {
				pl: {
					content: 'ckeditor5-core-pl-content'
				}
			},
			'ckeditor5-ui': {
				en_AU: {
					content: 'ckeditor5-ui-en-content'
				}
			}
		};

		const fileContents = {
			'ckeditor5-core-pl-content': {}, // empty
			'ckeditor5-ui-en-content': { ui: 'ui' }
		};

		// jscs:enable requireCamelCaseOrUpperCaseIdentifiers

		const getResourcesSpy = sandbox.spy( () => Promise.resolve( resources ) );
		const getResourceDetailsSpy = sandbox.spy( ( {
			slug
		} ) => Promise.resolve( resourcesDetails[ slug ] ) );
		const getTranslationSpy = sandbox.spy( ( {
			lang,
			slug
		} ) => Promise.resolve( translations[ slug ][ lang ] ) );
		const outputFileSyncSpy = sandbox.spy();

		const parsePoFileContentSpy = sandbox.spy( poFileContent => fileContents[ poFileContent ] );

		sandbox.stub( transifexService, 'getResources', getResourcesSpy );
		sandbox.stub( transifexService, 'getResourceDetails', getResourceDetailsSpy );
		sandbox.stub( transifexService, 'getTranslation', getTranslationSpy );
		sandbox.stub( fs, 'outputFileSync', outputFileSyncSpy );
		sandbox.stub( process, 'cwd', () => 'workspace' );
		sandbox.stub( translationUtils, 'parsePoFileContent', parsePoFileContentSpy );

		return download( {
			username: 'username',
			password: 'password'
		} ).then( () => {
			sinon.assert.calledOnce( getResourcesSpy );
			sinon.assert.calledTwice( getResourceDetailsSpy );
			sinon.assert.calledTwice( getTranslationSpy );
			sinon.assert.calledTwice( deleteSpy );
			sinon.assert.calledOnce( outputFileSyncSpy );

			sinon.assert.calledWithExactly(
				deleteSpy,
				path.join( 'workspace', 'packages', 'ckeditor5-core', 'lang', 'translations', '**' )
			);

			sinon.assert.calledWithExactly(
				outputFileSyncSpy,
				path.join( 'workspace', 'packages', 'ckeditor5-ui', 'lang', 'translations', 'en-au.po' ),
				'ckeditor5-ui-en-content'
			);
		} );
	} );
} );
