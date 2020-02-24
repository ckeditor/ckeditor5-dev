/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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
		const sandbox = sinon.createSandbox();

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
						'msgctxt "Toolbar"',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' ),
					[ pathToDeTranslations ]: [
						'msgctxt "Toolbar"',
						'msgid "Save"',
						'msgstr "Speichern"',
						''
					].join( '\n' )
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._localeData ).to.deep.equal( {
					pl: {
						'toolbar|save': 'Zapisz'
					},
					de: {
						'toolbar|save': 'Speichern'
					}
				} );
			} );

			it( 'should do nothing if the PO file does not exist', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._localeData ).to.deep.equal( {} );
			} );

			it( 'should load PO file from the package only once per language', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const loadPoFileSpy = sandbox.stub( translationService, '_loadLocaleFile' );

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
						'msgctxt "Toolbar"',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' ),
					[ pathToDeTranslations ]: [
						'msgctxt "Toolbar"',
						'msgid "Save"',
						'msgstr "Speichern"',
						''
					].join( '\n' )
				};

				dirContents = {
					[ pathToTranslations ]: [ 'pl.po', 'de.po' ]
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._localeData ).to.deep.equal( {
					pl: {
						'toolbar|save': 'Zapisz'
					},
					de: {
						'toolbar|save': 'Speichern'
					}
				} );

				expect( Array.from( translationService._languages ) ).to.deep.equal( [ 'pl', 'de' ] );
			} );
		} );

		describe( 'translateSource()', () => {
			it( 'should return original source always', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'de' ] } );
				const source = 't( \'Cancel\' )';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't( \'Cancel\' )' );
			} );
		} );

		describe( 'getAssets()', () => {
			it( 'should return an array of assets', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'en' ] } );

				translationService._localeData = {
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{"Cancel":"Anuluj","Save":"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					},
					{
						outputPath: path.join( 'lang', 'en.js' ),
						outputBody: '(function(d){d[\'en\']=Object.assign(d[\'en\']||{},{"Cancel":"Cancel","Save":"Save"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
			} );

			it( 'should return an array of empty assets when called for webpack plugins instead of ckeditor script', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'en' ] } );

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'SomeWebpackPlugin': { source: () => 'source' }
					}
				} );

				expect( assets ).to.deep.equal( [] );
			} );

			xit( 'should emit an error if the language is not present in language list', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'xxx' ] } );
				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._localeData = {
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

			xit( 'should feed missing translation with the translation key if the translated string is missing', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [ 'xxx' ] } );
				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._localeData = {
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{a:"Anuluj",b:"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					},
					{
						outputPath: path.join( 'lang', 'xxx.js' ),
						outputBody: '(function(d){d[\'xxx\']=Object.assign(d[\'xxx\']||{},{a:"Cancel",b:"Save"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
			} );

			xit( 'should emit an error if the translations for the main language are missing', () => {
				const translationService = new MultipleLanguageTranslationService( 'xxx', {
					additionalLanguages: [ 'pl' ]
				} );

				const errorSpy = sandbox.spy();

				translationService.on( 'error', errorSpy );

				translationService._localeData = {
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

			it( 'should emit warning when many assets will be emitted by compilator and return only translation assets', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', { additionalLanguages: [] } );
				const spy = sandbox.spy();

				translationService.on( 'warning', spy );

				translationService._localeData = {
					pl: {
						cancel: 'Anuluj',
						save: 'Zapisz',
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{"cancel":"Anuluj","save":"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
			} );

			it( 'should use output directory', () => {
				const translationService = new MultipleLanguageTranslationService( 'pl', {
					additionalLanguages: [ 'en' ],
				} );
				const spy = sandbox.spy();

				translationService.on( 'warning', spy );

				translationService._localeData = {
					pl: {
						cancel: 'Anuluj'
					},
					en: {
						cancel: 'Cancel'
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{"cancel":"Anuluj"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					},
					{
						outputPath: path.join( 'custom-lang-path', 'en.js' ),
						outputBody: '(function(d){d[\'en\']=Object.assign(d[\'en\']||{},{"cancel":"Cancel"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
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
						'msgctxt "Toolbar"',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' ),
					[ pathToDeTranslations ]: [
						'msgctxt "Toolbar"',
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{"toolbar|save":"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					},
					{
						outputPath: path.join( 'lang', 'de.js' ),
						outputBody: '(function(d){d[\'de\']=Object.assign(d[\'de\']||{},{"toolbar|save":"Speichern"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
			} );
		} );
	} );
} );
