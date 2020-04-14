/* eslint-disable no-eval */

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
		let window;

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

			window = {};
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'constructor()', () => {
			it( 'should initialize `SingleLanguageTranslationService`', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'en', additionalLanguages: [ 'pl' ] } );

				expect( translationService ).to.be.instanceof( MultipleLanguageTranslationService );
			} );
		} );

		describe( 'loadPackage()', () => {
			it( 'should load PO file from the package and load translations', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );
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

				expect( translationService._dictionaries ).to.deep.equal( {
					pl: {
						'Save': [ 'Zapisz' ]
					},
					de: {
						'Save': [ 'Speichern' ]
					}
				} );
			} );

			it( 'should do nothing if the PO file does not exist', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionaries ).to.deep.equal( {} );
			} );

			it( 'should load PO file from the package only once per language', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );
				const loadPoFileSpy = sandbox.stub( translationService, '_loadPoFile' );

				const pathToTranslationsDirectory = path.join( 'pathToPackage', 'lang', 'translations' );

				filesAndDirs = [ pathToTranslationsDirectory ];

				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );

				sinon.assert.calledTwice( loadPoFileSpy );
			} );

			it( 'should load all PO files for the current package and add languages to the language list', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					compileAllLanguages: true,
					additionalLanguages: []
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

				expect( translationService._dictionaries ).to.deep.equal( {
					pl: {
						'Save': [ 'Zapisz' ]
					},
					de: {
						'Save': [ 'Speichern' ]
					}
				} );

				expect( Array.from( translationService._languages ) ).to.deep.equal( [ 'pl', 'de' ] );
			} );
		} );

		describe( 'translateSource()', () => {
			it( 'should return the original source code', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );
				const source = 't( \'Cancel\' ), t( \'Save\' );';
				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't( \'Cancel\' ), t( \'Save\' );' );
			} );

			it( 'should collect found unique message ids', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );
				const source = 't( \'Cancel\' ), t( \'Cancel\' ), t( \'Save\' );';
				translationService.translateSource( source, 'file.js' );

				expect( Array.from( translationService._foundMessageIds ) ).to.deep.equal( [
					'Cancel',
					'Save'
				] );
			} );
		} );

		describe( 'getAssets()', () => {
			it( 'should return an array of assets', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._dictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					},
					en: {
						Cancel: [ 'Cancel' ],
						Save: [ 'Save' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets ).to.be.an( 'array' );

				expect( assets[ 0 ] ).to.have.property( 'outputPath', 'ckeditor.js' );
				expect( assets[ 0 ] ).to.have.property( 'shouldConcat', true );
				expect( assets[ 0 ] ).to.have.property( 'outputBody' );

				expect( assets[ 1 ] ).to.have.property( 'outputPath', path.join( 'lang', 'en.js' ) );
				expect( assets[ 1 ] ).to.not.have.property( 'shouldConcat' );
				expect( assets[ 1 ] ).to.have.property( 'outputBody' );
			} );

			it( 'should return executable translation assets', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._dictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					},
					en: {
						Cancel: [ 'Cancel' ],
						Save: [ 'Save' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				eval( assets[ 0 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.deep.equal( {
					pl: {
						dictionary: {
							Cancel: 'Anuluj',
							Save: 'Zapisz'
						}
					}
				} );

				eval( assets[ 1 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.deep.equal( {
					pl: {
						dictionary: {
							Cancel: 'Anuluj',
							Save: 'Zapisz'
						}
					},
					en: {
						dictionary: {
							Cancel: 'Cancel',
							Save: 'Save'
						}
					}
				} );
			} );

			// TODO
			it( 'should return an array of empty assets when called for webpack plugins instead of ckeditor script', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'SomeWebpackPlugin': { source: () => 'source' }
					}
				} );

				expect( assets ).to.deep.equal( [] );
			} );

			it( 'should emit an error if the language is not present in the language set', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'xxx' ]
				} );
				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._dictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				// TODO
				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, 'No translation found for the xxx language.' );
			} );

			it( 'should return an empty output if there is no translation present for the given language', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'xxx' ]
				} );

				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._dictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets[ 1 ] ).to.have.property( 'outputPath', path.join( 'lang', 'xxx.js' ) );
				expect( assets[ 1 ] ).to.have.property( 'outputBody', '' );

				eval( assets[ 1 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.be.undefined;
			} );

			it( 'should omit missing translations', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'xxx' ]
				} );

				const spy = sandbox.spy();

				translationService.on( 'error', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._dictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					},
					xxx: {
						Cancel: [ 'Foo' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssets: {
						'ckeditor.js': { source: () => 'source' }
					}
				} );

				expect( assets[ 1 ] ).to.have.property( 'outputPath', path.join( 'lang', 'xxx.js' ) );
				expect( assets[ 1 ] ).to.have.property( 'outputBody' );

				eval( assets[ 1 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.deep.equal( {
					xxx: {
						dictionary: {
							Cancel: 'Foo'
						}
					}
				} );
			} );

			it( 'should emit an error if translations for the main language are missing', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'xxx',
					additionalLanguages: [ 'pl' ]
				} );

				const errorSpy = sandbox.spy();

				translationService.on( 'error', errorSpy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionaries = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz'
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

			it( 'should emit a warning if the translation is missing', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: []
				} );
				const warningSpy = sandbox.spy();

				translationService.on( 'warning', warningSpy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionaries = {
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
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [] } );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._dictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ],
						Close: [ 'Zamknij' ]
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{a:"Anuluj",b:"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					}
				] );
			} );

			it( 'should emit warning when many assets will be emitted by compilator and return only translation assets', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [] } );
				const spy = sandbox.spy();

				translationService.on( 'warning', spy );

				translationService._translationIdsDictionary = {
					Cancel: 'a',
					Save: 'b'
				};

				translationService._dictionaries = {
					pl: {
						Cancel: 'Anuluj',
						Save: 'Zapisz'
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{a:"Anuluj",b:"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
			} );

			it( 'should use output directory', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );
				const spy = sandbox.spy();

				translationService.on( 'warning', spy );

				translationService._translationIdsDictionary = {
					Cancel: 'a'
				};

				translationService._dictionaries = {
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{a:"Anuluj"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					},
					{
						outputPath: path.join( 'custom-lang-path', 'en.js' ),
						outputBody: '(function(d){d[\'en\']=Object.assign(d[\'en\']||{},{a:"Cancel"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
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

				const translationService = new CustomTranslationService( { mainLanguage: 'en', additionalLanguages: [] } );

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

				expect( translationService._dictionaries ).to.deep.equal( {
					en: {
						'Save': [ 'Save' ]
					}
				} );
			} );
		} );

		describe( 'integration test', () => {
			it( 'test #1', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );
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
						outputBody: '(function(d){d[\'pl\']=Object.assign(d[\'pl\']||{},{a:"Zapisz"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));',
						shouldConcat: true
					},
					{
						outputPath: path.join( 'lang', 'de.js' ),
						outputBody: '(function(d){d[\'de\']=Object.assign(d[\'de\']||{},{a:"Speichern"})})' +
							'(window.CKEDITOR_TRANSLATIONS||(window.CKEDITOR_TRANSLATIONS={}));'
					}
				] );
			} );
		} );
	} );
} );
