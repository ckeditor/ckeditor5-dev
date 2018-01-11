/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const proxyquire = require( 'proxyquire' );

describe( 'translations', () => {
	describe( 'MultipleLanguageTranslationService', () => {
		let MultipleLanguageTranslationService, stubs, filesAndDirs, fileContents, dirContents;
		const sandbox = sinon.sandbox.create();

		beforeEach( () => {
			filesAndDirs = [];
			fileContents = {};
			dirContents = {};

			stubs = {
				fs: {
					existsSync: path => filesAndDirs.includes( path ),
					readFileSync: path => fileContents[ path ],
					readdirSync: dir => dirContents[ dir ]
				}
			};

			MultipleLanguageTranslationService = proxyquire( '../../lib/translations/multiplelanguagetranslationservice', {
				'fs': stubs.fs
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'constructor()', () => {
			it( 'should initialize `SingleLanguageTranslationService`', () => {
				const translationService = new MultipleLanguageTranslationService( 'en', { additionalLanguages: [ 'pl', 'de' ] } );

				expect( translationService ).to.be.instanceof( MultipleLanguageTranslationService );
			} );
		} );

		describe( 'loadPackage()', () => {
			it( 'should load PO file from the package and load translations', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const pathToTranslationsDirectory = path.join( 'pathToPackage', 'lang', 'translations' );
				const pathToPlTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'pl.po' );
				const pathToDeTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'de.po' );

				filesAndDirs = [ pathToPlTranslations, pathToDeTranslations, pathToTranslationsDirectory ];

				fileContents = {
					[ pathToPlTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' ),
					[ pathToDeTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Speichern"',
						''
					].join( '\n' )
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( {
					pl: {
						'Save': 'Zapisz'
					},
					de: {
						'Save': 'Speichern'
					}
				} );
			} );

			it( 'should do nothing if the PO file does not exist', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( {} );
			} );

			it( 'should load PO file from the package only once per language', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const loadPoFileSpy = sandbox.stub( translationService, '_loadPoFile' );

				const pathToTranslationsDirectory = path.join( 'pathToPackage', 'lang', 'translations' );

				filesAndDirs = [ pathToTranslationsDirectory ];

				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );

				sinon.assert.calledTwice( loadPoFileSpy );
			} );

			it( 'should load all PO files for the current package and add languages to the language list', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', {
					compileAllLanguages: true, additionalLanguages: []
				} );

				const pathToTranslations = path.join( 'pathToPackage', 'lang', 'translations' );
				const pathToPlTranslations = path.join( pathToTranslations, 'pl.po' );
				const pathToDeTranslations = path.join( pathToTranslations, 'de.po' );

				filesAndDirs = [ pathToPlTranslations, pathToDeTranslations, pathToTranslations ];

				fileContents = {
					[ pathToPlTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' ),
					[ pathToDeTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Speichern"',
						''
					].join( '\n' )
				};

				dirContents = {
					[ pathToTranslations ]: [ 'pl.po', 'de.po' ]
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( {
					pl: {
						'Save': 'Zapisz'
					},
					de: {
						'Save': 'Speichern'
					}
				} );

				expect( Array.from( translationService._languages ) ).to.deep.equal( [ 'pl', 'de' ] );
			} );
		} );

		describe( 'translateSource()', () => {
			it( 'should replace t() call params with the translation key, starting with `a`', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const source = 't( \'Cancel\' ), t( \'Save\' );';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't(\'a\'), t(\'b\');' );
				expect( translationService._translationIdsDictionary ).to.deep.equal( {
					Cancel: 'a',
					Save: 'b'
				} );
			} );

			it( 'should not create new id for the same translation key', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const source = 't( \'Cancel\' ), t( \'Cancel\' );';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't(\'a\'), t(\'a\');' );
				expect( translationService._translationIdsDictionary ).to.deep.equal( {
					Cancel: 'a'
				} );
			} );

			it( 'should return original source if there is no t() calls in the code', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const source = 'translate( \'Cancel\' )';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 'translate( \'Cancel\' )' );

				expect( translationService._translationIdsDictionary ).to.deep.equal( {} );
			} );
		} );

		describe( 'getAssets()', () => {
			it( 'should return an array of assets', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'en' ] } );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz',
					},
					en: {
						Cancel: 'Cancel',
						Save: 'Save'
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets ).to.deep.equal( [
					{
						outputPath: 'ckeditor.js',
						outputBody: 'source\n;CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					},
					{
						outputPath: path.join( 'lang', 'en.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'en\',{a:"Cancel",b:"Save"})'
					}
				] );
			} );

			it( 'should emit an error if the language is not present in language list', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'xxx' ] } );
				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz',
					}
				};

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, 'No translation found for xxx language.' );
			} );

			it( 'should feed missing translation with the translation key if the translated string is missing', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'xxx' ] } );
				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz',
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets ).to.deep.equal( [
					{
						outputPath: 'ckeditor.js',
						outputBody: 'source\n;CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					},
					{
						outputPath: path.join( 'lang', 'xxx.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'xxx\',{a:"Cancel",b:"Save"})'
					}
				] );
			} );

			it( 'should emit an error if the translations for the main language are missing', () => {
				const translationService = new MultipleLanguageTranslationService( 'xxx', {
					additionalLanguages: [ 'pl' ]
				} );

				const errorSpy = sandbox.spy();

				translationService.on( 'error', errorSpy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz',
					}
				};

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				sinon.assert.calledOnce( errorSpy );
				sinon.assert.calledWithExactly( errorSpy, 'No translation found for xxx language.' );
			} );

			it( 'should emit an warning if the translation is missing', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', {
					additionalLanguages: []
				} );
				const warningSpy = sandbox.spy();

				translationService.on( 'warning', warningSpy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj'
					}
				};

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				sinon.assert.calledOnce( warningSpy );
				sinon.assert.calledWithExactly( warningSpy, 'Missing translation for \'Save\' for \'pl\' language.' );
			} );

			it( 'should bound to assets only used translations', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [] } );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz',
						Close: 'Zamknij',
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				// Note that the last translation from the above dictionary is skipped.
				expect( assets ).to.deep.equal( [
					{
						outputPath: 'ckeditor.js',
						outputBody: 'source\n;CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					}
				] );
			} );

			it( 'should emit warning when many assets will be emitted by compilator and return only translation assets', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [] } );
				const spy = sandbox.spy();

				translationService.on( 'warning', spy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz',
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' },
						'ckeditor2.js': { source: () => 'source' }
					}
				} );

				sinon.assert.calledOnce( spy );
				sinon.assert.alwaysCalledWithExactly( spy, [
					'Because of the many found bundles, none of the bundles will contain the main language.',
					`You should add it directly to the application from the 'lang${ path.sep }pl.js'.`
				].join( '\n' ) );

				expect( assets ).to.deep.equal( [
					{
						outputPath: path.join( 'lang', 'pl.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					}
				] );
			} );

			it( 'should use output directory', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', {
					additionalLanguages: [ 'en' ],
				} );
				const spy = sandbox.spy();

				translationService.on( 'warning', spy );

				translationService._translationIdsDictionary = {
					Cancel: 'a'
				};

				translationService._dictionary = {
					pl: {
						Cancel: 'Anuluj'
					},
					en: {
						Cancel: 'Cancel'
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'custom-lang-path',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets ).to.deep.equal( [
					{
						outputPath: 'ckeditor.js',
						outputBody: 'source\n;CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj"})'
					},
					{
						outputPath: path.join( 'custom-lang-path', 'en.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'en\',{a:"Cancel"})'
					}
				] );
			} );
		} );

		describe( '_getPathToTranslationDirectory', () => {
			it( 'should be overridable to enable providing custom path to translation files', () => {
				class CustomTranslationService extends MultipleLanguageTranslationService {
					_getPathToTranslationDirectory( pathToPackage ) {
						return path.join( 'custom', 'path', 'to', pathToPackage );
					}
				}

				const translationService = new CustomTranslationService( 'en', { additionalLanguages: [] } );

				const pathToPlTranslations = path.join( 'custom', 'path', 'to', 'pathToPackage', 'en.po' );
				const pathToTranslationDirectory = path.join( 'custom', 'path', 'to', 'pathToPackage' );

				filesAndDirs = [ pathToPlTranslations, pathToTranslationDirectory ];

				fileContents = {
					[ pathToPlTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Save"',
						''
					].join( '\n' )
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( {
					en: {
						'Save': 'Save'
					}
				} );
			} );
		} );

		describe( 'integration test', () => {
			it( 'test #1', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const pathToPlTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'pl.po' );
				const pathToDeTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'de.po' );
				const pathToTranslationsDirectory = path.join( 'pathToPackage', 'lang', 'translations' );

				filesAndDirs = [ pathToPlTranslations, pathToDeTranslations, pathToTranslationsDirectory ];

				fileContents = {
					[ pathToPlTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' ),
					[ pathToDeTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Speichern"',
						''
					].join( '\n' )
				};

				translationService.loadPackage( 'pathToPackage' );
				translationService.translateSource( 't( \'Save\' );' );

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets ).to.deep.equal( [
					{
						outputPath: 'ckeditor.js',
						outputBody: 'source\n;CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Zapisz"})'
					},
					{
						outputPath: path.join( 'lang', 'de.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'de\',{a:"Speichern"})'
					}
				] );
			} );
		} );
	} );
} );
