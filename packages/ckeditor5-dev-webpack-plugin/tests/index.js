/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const SingleLanguageTranslationService = require( '@ckeditor/ckeditor5-dev-utils/lib/translations/singlelanguagetranslationservice' );
const MultipleLanguageTranslationService = require( '@ckeditor/ckeditor5-dev-utils/lib/translations/multiplelanguagetranslationservice' );

describe( 'webpack-plugin/CKEditorWebpackPlugin', () => {
	const sandbox = sinon.createSandbox();
	let CKEditorWebpackPlugin, stubs;

	beforeEach( () => {
		stubs = {
			serveTranslations: sandbox.spy()
		};

		CKEditorWebpackPlugin = proxyquire( '../lib/index', {
			'./servetranslations': stubs.serveTranslations
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'constructor()', () => {
		it( 'should initialize with passed options', () => {
			const options = { languages: [] };

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( ckeditorWebpackPlugin.options ).to.equal( options );
		} );
	} );

	describe( 'apply()', () => {
		it( 'should throw if language array is empty', () => {
			const options = { languages: [] };

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( () => ckeditorWebpackPlugin.apply( {} ) ).to.throw(
				'At least one target language should be specified.'
			);
		} );

		it( 'should return and do nothing if language array is not specified', () => {
			const options = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.notCalled( stubs.serveTranslations );
		} );

		it( 'should throw an error when `optimizeBuildForOneLanguage` is enabled and multiple languages are selected.', () => {
			const options = {
				languages: [ 'pl', 'de' ],
				optimizeBuildForOneLanguage: true
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( () => ckeditorWebpackPlugin.apply( {} ) ).to.throw(
				'Only one language should be specified when `optimizeBuildForOneLanguage` option is on.'
			);
		} );

		it( 'should serve `SingleLanguageTranslationService` if the `optimizeBuildForOneLanguage` is enabled.', () => {
			const options = {
				languages: [ 'pl' ],
				optimizeBuildForOneLanguage: true
			};

			const compiler = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( compiler );

			sinon.assert.calledOnce( stubs.serveTranslations );
			expect( stubs.serveTranslations.getCall( 0 ).args[ 0 ] ).to.equal( compiler );
			expect( stubs.serveTranslations.getCall( 0 ).args[ 1 ] ).to.equal( options );
			expect( stubs.serveTranslations.getCall( 0 ).args[ 2 ] ).to.be.instanceof( SingleLanguageTranslationService );
		} );

		it( 'should serve `MultipleLanguageTranslationService` if the `optimizeBuildForOneLanguage` is disabled.', () => {
			const options = {
				languages: [ 'pl' ]
			};

			const compiler = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( compiler );

			sinon.assert.calledOnce( stubs.serveTranslations );
			expect( stubs.serveTranslations.getCall( 0 ).args[ 0 ] ).to.equal( compiler );
			expect( stubs.serveTranslations.getCall( 0 ).args[ 1 ] ).to.equal( options );
			expect( stubs.serveTranslations.getCall( 0 ).args[ 2 ] ).to.be.instanceof( MultipleLanguageTranslationService );
		} );
	} );
} );
