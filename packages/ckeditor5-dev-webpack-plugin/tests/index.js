/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'webpack-plugin/CKEditorWebpackPlugin', () => {
	let sandbox, CKEditorWebpackPlugin, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		stubs = {
			serveTranslations: sandbox.spy(),
			MultipleLanguageTranslationService: sandbox.spy()
		};

		CKEditorWebpackPlugin = proxyquire( '../lib/index', {
			'./servetranslations': stubs.serveTranslations,
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
				/Warning: The `language` option is required for CKEditorWebpackPlugin plugin\./
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

		describe( 'should create an instance of `MultipleLanguageTranslationService`', () => {
			it( 'for one language is provided', () => {
				const options = {
					language: 'pl'
				};

				const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );
				ckeditorWebpackPlugin.apply( {} );

				sinon.assert.calledOnce( stubs.serveTranslations );

				sinon.assert.calledOnce( stubs.MultipleLanguageTranslationService );
				sinon.assert.calledWithExactly(
					stubs.MultipleLanguageTranslationService,
					{
						mainLanguage: 'pl',
						compileAllLanguages: false,
						additionalLanguages: [],
						buildAllTranslationsToSeparateFiles: false,
						addMainLanguageTranslationsToAllAssets: false,
						translationsOutputFile: undefined
					}
				);
			} );

			it( 'for additional languages provided', () => {
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
					{
						mainLanguage: 'pl',
						compileAllLanguages: false,
						additionalLanguages: [ 'en' ],
						buildAllTranslationsToSeparateFiles: false,
						addMainLanguageTranslationsToAllAssets: false,
						translationsOutputFile: undefined
					}
				);
			} );

			it( 'for `additionalLanguages` set to `all`', () => {
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
					{
						mainLanguage: 'en',
						compileAllLanguages: true,
						additionalLanguages: [],
						buildAllTranslationsToSeparateFiles: false,
						addMainLanguageTranslationsToAllAssets: false,
						translationsOutputFile: undefined
					}
				);

				sinon.assert.notCalled( console.warn );
			} );
		} );

		it( 'should throw an error when provided `additionalLanguages` is type of string, but not `all`', () => {
			const options = {
				language: 'en',
				additionalLanguages: 'abc'
			};

			const ckeditorWebpackPlugin = new CKEditorWebpackPlugin( options );

			expect( () => ckeditorWebpackPlugin.apply( {} ) ).to.throw(
				/Error: The `additionalLanguages` option should be an array of language codes or `all`\./
			);
		} );
	} );
} );
