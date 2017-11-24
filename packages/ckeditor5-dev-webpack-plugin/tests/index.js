/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'webpack-plugin/CKEditorWebpackPlugin', () => {
	const sandbox = sinon.createSandbox();
	let CKEditorWebpackPlugin, stubs;

	beforeEach( () => {
		class SingleLanguageTranslationService {
		}

		class MultipleLanguageTranslationService {
		}
		stubs = {
			serveTranslations: sandbox.spy(),
			ckeditor5EnvUtils: {},
			SingleLanguageTranslationService: sandbox.spy( function() {
				return sinon.createStubInstance( SingleLanguageTranslationService );
			} ),
			MultipleLanguageTranslationService: sandbox.spy( function() {
				return sinon.createStubInstance( MultipleLanguageTranslationService );
			} )
		};

		CKEditorWebpackPlugin = proxyquire( '../lib/index', {
			'./servetranslations': stubs.serveTranslations,
			'./ckeditor5-env-utils': stubs.ckeditor5EnvUtils,
			'@ckeditor/ckeditor5-dev-utils/lib/translations/singlelanguagetranslationservice': stubs.SingleLanguageTranslationService,
			'@ckeditor/ckeditor5-dev-utils/lib/translations/multiplelanguagetranslationservice': stubs.MultipleLanguageTranslationService
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'constructor()', () => {
		it( 'should initialize with passed options', () => {
			const options = { language: 'pl' };

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( ckeditorWebpackPlugin.options ).to.equal( options );
		} );
	} );

	describe( 'apply()', () => {
		it( 'should return and do nothing if language is not specified', () => {
			const options = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.notCalled( stubs.serveTranslations );
		} );

		it( 'should call serveTranslations() if the options are correct', () => {
			const options = {
				language: 'pl'
			};

			const compiler = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( compiler );

			sinon.assert.calledOnce( stubs.serveTranslations );
			sinon.assert.calledWith( stubs.serveTranslations, compiler, options );
		} );

		it( 'should serve `SingleLanguageTranslationService` if only one language is provided.', () => {
			const options = {
				language: 'pl'
			};

			const compiler = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( compiler );

			sinon.assert.calledOnce( stubs.SingleLanguageTranslationService );
			sinon.assert.calledWithExactly( stubs.SingleLanguageTranslationService, 'pl' );
		} );

		it( 'should serve `MultipleLanguageTranslationService` if more than 1 language is provided.', () => {
			const options = {
				language: 'pl',
				additionalLanguages: [ 'en' ]
			};

			const compiler = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( compiler );

			sinon.assert.calledOnce( stubs.serveTranslations );

			sinon.assert.calledOnce( stubs.MultipleLanguageTranslationService );
			sinon.assert.calledWithExactly(
				stubs.MultipleLanguageTranslationService,
				'pl',
				{ compileAllLanguages: false, additionalLanguages: [ 'en' ] }
			);
		} );

		it( 'should serve `MultipleLanguageTranslationService` if the `additionalLanguages` is set to `all`.', () => {
			const options = {
				language: 'en',
				additionalLanguages: 'all'
			};

			const compiler = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( compiler );

			sinon.assert.calledOnce( stubs.serveTranslations );

			sinon.assert.calledOnce( stubs.MultipleLanguageTranslationService );
			sinon.assert.calledWithExactly(
				stubs.MultipleLanguageTranslationService,
				'en',
				{ compileAllLanguages: true, additionalLanguages: [] }
			);
		} );
	} );
} );
