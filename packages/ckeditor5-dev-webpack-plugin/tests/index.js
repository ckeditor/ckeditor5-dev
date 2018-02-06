/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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

		sandbox.stub( console, 'warn' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'constructor()', () => {
		it( 'should initialize with passed options', () => {
			const options = { language: 'pl' };

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( ckeditorWebpackPlugin.options ).to.be.an( 'object' );
			expect( ckeditorWebpackPlugin.options.language ).to.equal( 'pl' );
		} );

		it( 'should initialize default value for `outputDirectory` option', () => {
			const options = {};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( ckeditorWebpackPlugin.options.outputDirectory ).to.equal( 'translations' );
		} );

		it( 'should use `outputDirectory` if passed', () => {
			const options = { outputDirectory: 'custom' };

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( ckeditorWebpackPlugin.options.outputDirectory ).to.equal( 'custom' );
		} );
	} );

	describe( 'apply()', () => {
		it( 'should log a warning and do nothing if language is not specified', () => {
			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( {} );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.calledOnce( console.warn );
			expect( console.warn.getCall( 0 ).args[ 0 ] ).to.match(
				/Warning: `language` option is required for CKEditorWebpackPlugin plugin\./
			);

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
		} );

		it( 'should serve `SingleLanguageTranslationService` if only one language is provided', () => {
			const options = {
				language: 'pl'
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.calledOnce( stubs.SingleLanguageTranslationService );
			sinon.assert.calledWithExactly( stubs.SingleLanguageTranslationService, 'pl' );
		} );

		it( 'should serve `MultipleLanguageTranslationService` if more than 1 language is provided', () => {
			const options = {
				language: 'pl',
				additionalLanguages: [ 'en' ]
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.calledOnce( stubs.serveTranslations );

			sinon.assert.calledOnce( stubs.MultipleLanguageTranslationService );
			sinon.assert.calledWithExactly(
				stubs.MultipleLanguageTranslationService,
				'pl',
				{ compileAllLanguages: false, additionalLanguages: [ 'en' ] }
			);
		} );

		it( 'should serve `MultipleLanguageTranslationService` if the `additionalLanguages` is set to `all`', () => {
			const options = {
				language: 'en',
				additionalLanguages: 'all'
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.calledOnce( stubs.serveTranslations );

			sinon.assert.calledOnce( stubs.MultipleLanguageTranslationService );
			sinon.assert.calledWithExactly(
				stubs.MultipleLanguageTranslationService,
				'en',
				{ compileAllLanguages: true, additionalLanguages: [] }
			);

			sinon.assert.notCalled( console.warn );
		} );

		it( 'should log a warning if `additionalLanguages` is not specified while `outputDirectory` is set', () => {
			const options = {
				language: 'en',
				outputDirectory: 'custom-lang',
				verbose: true
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
			ckeditorWebpackPlugin.apply( {} );

			sinon.assert.calledOnce( console.warn );
			expect( console.warn.getCall( 0 ).args[ 0 ] ).to.match(
				/Warning: `outputDirectory` option does not work for one language\. It will be ignored\./
			);
		} );

		it( 'should throw an error when provided `additionalLanguages` is type of string, but not `all`', () => {
			const options = {
				language: 'en',
				additionalLanguages: 'abc'
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( () => ckeditorWebpackPlugin.apply( {} ) ).to.throw(
				/Error: `additionalLanguages` option should be an array of language codes or `all`\./
			);
		} );
	} );
} );
