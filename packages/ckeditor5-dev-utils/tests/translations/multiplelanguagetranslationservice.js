/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const proxyquire = require( 'proxyquire' );

describe( 'translations', () => {
	describe( 'MultipleLanguageTranslationService', () => {
		let MultipleLanguageTranslationService, stubs, files, fileContents, sandbox;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				fs: {
					existsSync: path => files.includes( path ),
					readFileSync: path => fileContents[ path ]
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
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );

				expect( translationService ).to.be.instanceof( MultipleLanguageTranslationService );
			} );
		} );

		describe( 'loadPackage()', () => {
			it( 'should load po file from the package and load translations', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );
				const pathToPlTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'pl.po' );
				const pathToDeTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'de.po' );

				files = [ pathToPlTranslations, pathToDeTranslations ];

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

			it( 'should do nothing if the po file does not exist', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );

				files = [];
				fileContents = {};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( {} );
			} );

			it( 'should load po file from the package only once per language', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );
				const loadPoFileSpy = sandbox.stub( translationService, '_loadPoFile' );

				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );

				sinon.assert.calledTwice( loadPoFileSpy );
			} );
		} );

		describe( 'translateSource()', () => {
			it( 'should replace t() call params with the translation id, starting with `a`', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );
				const source = 't( \'Cancel\' ), t( \'Save\' );';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't(\'a\'), t(\'b\');' );
				expect( translationService._translationIdsDictionary ).to.deep.equal( {
					Cancel: 'a',
					Save: 'b'
				} );
			} );

			it( 'should return original source if there is no t() calls in the code', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );
				const source = 'translate( \'Cancel\' )';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 'translate( \'Cancel\' )' );

				expect( translationService._translationIdsDictionary ).to.deep.equal( {} );
			} );
		} );

		describe( 'getAssets()', () => {
			it( 'should return an array of assets', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'en' ] );

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

				const assets = translationService.getAssets();

				expect( assets ).to.deep.equal( [
					{
						outputPath: path.join( 'lang', 'pl.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					},
					{
						outputPath: path.join( 'lang', 'en.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'en\',{a:"Cancel",b:"Save"})'
					}
				] );
			} );

			it( 'should emit an error if the language is not present in language list', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'xxx' ] );
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

				translationService.getAssets();

				sinon.assert.calledThrice( spy );
				sinon.assert.calledWithExactly( spy, 'No translation found for xxx language.' );
				sinon.assert.calledWithExactly( spy, 'Missing translation for \'Cancel\' for xxx language.' );
				sinon.assert.calledWithExactly( spy, 'Missing translation for \'Save\' for xxx language.' );
			} );

			it( 'should feed missing translation with the translation key if the translated string is missing', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'xxx' ] );
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

				const assets = translationService.getAssets();

				expect( assets ).to.deep.equal( [
					{
						outputPath: path.join( 'lang', 'pl.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					},
					{
						outputPath: path.join( 'lang', 'xxx.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'xxx\',{a:"Cancel",b:"Save"})'
					}
				] );
			} );

			it( 'should bound to assets only used translations', () => {
				const translationService = new MultipleLanguageTranslationService( [ 'pl' ] );
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
						Close: 'Zamknij',
					}
				};

				const assets = translationService.getAssets();

				// Note that the last translation from the above dictionary is skipped.
				expect( assets ).to.deep.equal( [
					{
						outputPath: path.join( 'lang', 'pl.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Anuluj",b:"Zapisz"})'
					}
				] );
			} );
		} );

		describe( '_getPathToPackage', () => {
			it( 'should be overridable to enable providing custom path to translation files', () => {
				class CustomTranslationService extends MultipleLanguageTranslationService {
					_getPathToPoFile( pathToPackage, languageCode ) {
						return path.join( 'custom', 'path', 'to', pathToPackage, languageCode + '.PO' );
					}
				}

				const translationService = new CustomTranslationService( [ 'en' ] );

				const pathToTranslations = path.join( 'custom', 'path', 'to', 'pathToPackage', 'en.PO' );

				files = [ pathToTranslations ];

				fileContents = {
					[ pathToTranslations ]: [
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
				const translationService = new MultipleLanguageTranslationService( [ 'pl', 'de' ] );
				const pathToPlTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'pl.po' );
				const pathToDeTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'de.po' );

				files = [ pathToPlTranslations, pathToDeTranslations ];

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
				const assets = translationService.getAssets();

				expect( assets ).to.deep.equal( [
					{
						outputPath: path.join( 'lang', 'pl.js' ),
						outputBody: 'CKEDITOR_TRANSLATIONS.add(\'pl\',{a:"Zapisz"})'
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
