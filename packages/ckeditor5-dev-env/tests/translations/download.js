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

describe( 'download', () => {
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should download translations', () => {
		const resources = [
			{ slug: 'ckeditor5-core' },
			{ slug: 'ckeditor5-ui' }
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
					code: 'en'
				} ]
			}
		};

		const translations = {
			'ckeditor5-core': {
				pl: { content: 'ckeditor5-core-pl-content' }
			},
			'ckeditor5-ui': {
				en: { content: 'ckeditor5-ui-en-content' }
			}
		};

		// jscs:enable requireCamelCaseOrUpperCaseIdentifiers

		const getResourcesSpy = sandbox.spy( () => Promise.resolve( resources ) );
		const getResourceDetailsSpy = sandbox.spy( ( { slug } ) => Promise.resolve( resourcesDetails[ slug ] ) );
		const getTranslationSpy = sandbox.spy( ( { lang, slug } ) => Promise.resolve( translations[ slug ][ lang ] ) );
		const outputFileSyncSpy = sandbox.spy();

		sandbox.stub( transifexService, 'getResources', getResourcesSpy );
		sandbox.stub( transifexService, 'getResourceDetails', getResourceDetailsSpy );
		sandbox.stub( transifexService, 'getTranslation', getTranslationSpy );
		sandbox.stub( fs, 'outputFileSync', outputFileSyncSpy );
		sandbox.stub( process, 'cwd', () => 'workspace' );

		return download( {
			username: 'username',
			password: 'password'
		} ).then( () => {
			sinon.assert.calledOnce( getResourcesSpy );
			sinon.assert.calledTwice( getResourceDetailsSpy );
			sinon.assert.calledTwice( getTranslationSpy );
			sinon.assert.calledTwice( outputFileSyncSpy );
			sinon.assert.calledWithExactly(
				outputFileSyncSpy,
				path.join( 'workspace', 'packages', 'ckeditor5-core', 'lang', 'translations', 'pl.po' ),
				'ckeditor5-core-pl-content'
			);
			sinon.assert.calledWithExactly(
				outputFileSyncSpy,
				path.join( 'workspace', 'packages', 'ckeditor5-ui', 'lang', 'translations', 'en.po' ),
				'ckeditor5-ui-en-content'
			);
		} );
	} );
} );
