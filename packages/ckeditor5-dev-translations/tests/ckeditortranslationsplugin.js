/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import CKEditorTranslationsPlugin from '../lib/ckeditortranslationsplugin.js';
import serveTranslations from '../lib/servetranslations.js';
import MultipleLanguageTranslationService from '../lib/multiplelanguagetranslationservice.js';

vi.mock( '../lib/servetranslations' );
vi.mock( '../lib/multiplelanguagetranslationservice', () => ( { default: vi.fn() } ) );

describe( 'dev-translations/CKEditorTranslationsPlugin', () => {
	describe( 'constructor()', () => {
		it( 'should initialize with passed options', () => {
			const options = { language: 'pl' };

			const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );

			expect( ckEditorTranslationsPlugin.options ).to.be.an( 'object' );
			expect( ckEditorTranslationsPlugin.options.language ).to.equal( 'pl' );
		} );

		it( 'should initialize default value for `outputDirectory` option', () => {
			const options = {};

			const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );

			expect( ckEditorTranslationsPlugin.options.outputDirectory ).to.equal( 'translations' );
		} );

		it( 'should use `outputDirectory` if passed', () => {
			const options = { outputDirectory: 'custom' };

			const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );

			expect( ckEditorTranslationsPlugin.options.outputDirectory ).to.equal( 'custom' );
		} );

		describe( 'options', () => {
			describe( '#corePackageContextsResourcePath', () => {
				it( 'should use the default value if not set', () => {
					const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( {} );

					expect( ckEditorTranslationsPlugin.options.corePackageContextsResourcePath ).to.equal(
						'@ckeditor/ckeditor5-core/lang/contexts.json'
					);
				} );

				it( 'should overwrite the default value if specified in the configuration', () => {
					const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( {
						corePackageContextsResourcePath: '@ckeditor/ckeditor5-utils/lang/contexts.json'
					} );

					expect( ckEditorTranslationsPlugin.options.corePackageContextsResourcePath ).to.equal(
						'@ckeditor/ckeditor5-utils/lang/contexts.json'
					);
				} );
			} );

			describe( '#includeCorePackageTranslations', () => {
				it( 'should use the default value if not set', () => {
					const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( {} );

					expect( ckEditorTranslationsPlugin.options.includeCorePackageTranslations ).to.equal( false );
				} );

				it( 'should overwrite the default value if specified in the configuration', () => {
					const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( {
						includeCorePackageTranslations: true
					} );

					expect( ckEditorTranslationsPlugin.options.includeCorePackageTranslations ).to.equal( true );
				} );
			} );

			describe( '#skipPluralFormFunction', () => {
				it( 'should use the default value if not set', () => {
					const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( {} );

					expect( ckEditorTranslationsPlugin.options.skipPluralFormFunction ).to.equal( false );
				} );

				it( 'should overwrite the default value if specified in the configuration', () => {
					const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( {
						skipPluralFormFunction: true
					} );

					expect( ckEditorTranslationsPlugin.options.skipPluralFormFunction ).to.equal( true );
				} );
			} );
		} );
	} );

	describe( 'apply()', () => {
		it( 'should call serveTranslations() if the options are correct', () => {
			const options = {
				language: 'pl'
			};

			const compiler = {
				options: {
					output: { path: 'test-path' }
				}
			};

			const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );
			ckEditorTranslationsPlugin.apply( compiler );

			expect( serveTranslations ).toHaveBeenCalledOnce();
		} );

		describe( 'should create an instance of `MultipleLanguageTranslationService`', () => {
			it( 'for one language is provided', () => {
				const options = {
					language: 'pl'
				};

				const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );
				ckEditorTranslationsPlugin.apply( {} );

				expect( serveTranslations ).toHaveBeenCalledOnce();

				expect( MultipleLanguageTranslationService ).toHaveBeenCalledOnce();
				expect( MultipleLanguageTranslationService ).toHaveBeenCalledWith( expect.objectContaining( {
					mainLanguage: 'pl',
					compileAllLanguages: false,
					additionalLanguages: [],
					buildAllTranslationsToSeparateFiles: false,
					addMainLanguageTranslationsToAllAssets: false,
					translationsOutputFile: undefined,
					skipPluralFormFunction: false
				} ) );
			} );

			it( 'for additional languages provided', () => {
				const options = {
					language: 'pl',
					additionalLanguages: [ 'en' ]
				};

				const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );
				ckEditorTranslationsPlugin.apply( {} );

				expect( serveTranslations ).toHaveBeenCalledOnce();

				expect( MultipleLanguageTranslationService ).toHaveBeenCalledOnce();
				expect( MultipleLanguageTranslationService ).toHaveBeenCalledWith( expect.objectContaining( {
					mainLanguage: 'pl',
					compileAllLanguages: false,
					additionalLanguages: [ 'en' ],
					buildAllTranslationsToSeparateFiles: false,
					addMainLanguageTranslationsToAllAssets: false,
					translationsOutputFile: undefined,
					skipPluralFormFunction: false
				} ) );
			} );

			it( 'for `additionalLanguages` set to `all`', () => {
				const consoleWarnSpy = vi.spyOn( console, 'warn' );

				const options = {
					language: 'en',
					additionalLanguages: 'all'
				};

				const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );
				ckEditorTranslationsPlugin.apply( {} );

				expect( serveTranslations ).toHaveBeenCalledOnce();

				expect( MultipleLanguageTranslationService ).toHaveBeenCalledOnce();
				expect( MultipleLanguageTranslationService ).toHaveBeenCalledWith( expect.objectContaining( {
					mainLanguage: 'en',
					compileAllLanguages: true,
					additionalLanguages: [],
					buildAllTranslationsToSeparateFiles: false,
					addMainLanguageTranslationsToAllAssets: false,
					translationsOutputFile: undefined,
					skipPluralFormFunction: false
				} ) );

				expect( consoleWarnSpy ).not.toBeCalled();
			} );

			it( 'passes the skipPluralFormFunction option to the translation service', () => {
				const options = {
					language: 'pl',
					skipPluralFormFunction: true
				};

				const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );
				ckEditorTranslationsPlugin.apply( {} );

				expect( serveTranslations ).toHaveBeenCalledOnce();

				expect( MultipleLanguageTranslationService ).toHaveBeenCalledOnce();
				expect( MultipleLanguageTranslationService ).toHaveBeenCalledWith( expect.objectContaining( {
					mainLanguage: 'pl',
					compileAllLanguages: false,
					additionalLanguages: [],
					buildAllTranslationsToSeparateFiles: false,
					addMainLanguageTranslationsToAllAssets: false,
					translationsOutputFile: undefined,
					skipPluralFormFunction: true
				} ) );
			} );
		} );

		it( 'should throw an error when provided `additionalLanguages` is type of string, but not `all`', () => {
			const options = {
				language: 'en',
				additionalLanguages: 'abc'
			};

			const ckEditorTranslationsPlugin = new CKEditorTranslationsPlugin( options );

			expect( () => ckEditorTranslationsPlugin.apply( {} ) ).to.throw(
				/Error: The `additionalLanguages` option should be an array of language codes or `all`\./
			);
		} );
	} );
} );
