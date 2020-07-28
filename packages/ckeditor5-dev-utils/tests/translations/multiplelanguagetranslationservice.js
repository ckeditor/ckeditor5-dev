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

describe.only( 'translations', () => {
	describe( 'MultipleLanguageTranslationService', () => {
		let MultipleLanguageTranslationService, stubs, filesAndDirs, fileContents, dirContents;
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
			sinon.restore();
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

				expect( translationService._translationDictionaries ).to.deep.equal( {
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

				expect( translationService._translationDictionaries ).to.deep.equal( {} );
			} );

			it( 'should load PO file from the package only once per language', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [ 'de' ] } );
				const loadPoFileSpy = sinon.stub( translationService, '_loadPoFile' );

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

				expect( translationService._translationDictionaries ).to.deep.equal( {
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

				translationService._translationDictionaries = {
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
					compilationAssetNames: [ 'ckeditor.js' ]
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
					mainLanguage: 'pl'
				} );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
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
			} );

			it( 'should return deterministic assets', () => {
				const translationServiceA = new MultipleLanguageTranslationService( { mainLanguage: 'pl' } );
				const translationServiceB = new MultipleLanguageTranslationService( { mainLanguage: 'pl' } );

				translationServiceA._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );
				translationServiceB._foundMessageIds = new Set( [
					'Save',
					'Cancel'
				] );

				translationServiceA._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};
				translationServiceB._translationDictionaries = {
					pl: {
						Save: [ 'Zapisz' ],
						Cancel: [ 'Anuluj' ]
					}
				};

				const assetsA = translationServiceA.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				const assetsB = translationServiceA.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				expect( assetsA ).to.deep.equal( assetsB );
			} );

			it( 'should return assets that merges different languages after the execution', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
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
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				eval( assets[ 0 ].outputBody );
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

			it( 'should return assets that can be executed twice', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: []
				} );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				eval( assets[ 0 ].outputBody );
				eval( assets[ 0 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.deep.equal( {
					pl: {
						dictionary: {
							Cancel: 'Anuluj',
							Save: 'Zapisz'
						}
					}
				} );
			} );

			it( 'should return assets with plural forms', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl'
				} );

				translationService._foundMessageIds = new Set( [
					'Add %0 button'
				] );

				translationService._translationDictionaries = {
					pl: {
						'Add %0 button': [ 'Dodaj przycisk', 'Dodaj %0 przyciski', 'Dodaj %0 przycisków' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				eval( assets[ 0 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.deep.equal( {
					pl: {
						dictionary: {
							'Add %0 button': [ 'Dodaj przycisk', 'Dodaj %0 przyciski', 'Dodaj %0 przycisków' ]
						}
					}
				} );
			} );

			it( 'should provide `getPluralForm` function for the given language that can be used to determine the plural form', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl'
				} );

				translationService._foundMessageIds = new Set( [
					'Add %0 button'
				] );

				translationService._translationDictionaries = {
					pl: {
						'Add %0 button': [ 'Dodaj przycisk', 'Dodaj %0 przyciski', 'Dodaj %0 przycisków' ]
					}
				};

				translationService._pluralFormsRules = {
					pl: 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2)'
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				eval( assets[ 0 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS.pl.dictionary ).to.deep.equal( {
					'Add %0 button': [ 'Dodaj przycisk', 'Dodaj %0 przyciski', 'Dodaj %0 przycisków' ]
				} );

				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm ).to.be.a( 'function' );

				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm( 0 ) ).to.equal( 2 );
				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm( 1 ) ).to.equal( 0 );
				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm( 2 ) ).to.equal( 1 );
				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm( 5 ) ).to.equal( 2 );
				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm( 12 ) ).to.equal( 2 );
				expect( window.CKEDITOR_TRANSLATIONS.pl.getPluralForm( 103 ) ).to.equal( 1 );
			} );

			it( 'should do nothing when no JS assets was passed', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );

				const errorSpy = sinon.spy();

				translationService.on( 'error', errorSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
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
					compilationAssetNames: [ 'SomeWebpackPlugin' ]
				} );

				sinon.assert.notCalled( errorSpy );

				expect( assets.length ).to.deep.equal( 0 );
			} );

			it( 'should return an empty asset for the language that has no translation defined', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'xxx' ]
				} );

				const spy = sinon.spy();

				translationService.on( 'error', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				expect( assets[ 1 ] ).to.have.property( 'outputPath', path.join( 'lang', 'xxx.js' ) );
				expect( assets[ 1 ] ).to.have.property( 'outputBody', '' );

				eval( assets[ 1 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.be.undefined;
			} );

			it( 'should not include missing translations', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'xxx' ]
				} );

				const spy = sinon.spy();

				translationService.on( 'error', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
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
					compilationAssetNames: [ 'ckeditor.js' ]
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

			it( 'should emit an error if the language is not present in the language set', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'xxx' ]
				} );
				const spy = sinon.spy();

				translationService.on( 'error', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, 'No translation has been found for the xxx language.' );
			} );

			it( 'should emit an error if translations for the main language are missing', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'xxx',
					additionalLanguages: [ 'pl' ]
				} );

				const errorSpy = sinon.spy();

				translationService.on( 'error', errorSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				sinon.assert.calledOnce( errorSpy );
				sinon.assert.calledWithExactly( errorSpy, 'No translation has been found for the xxx language.' );
			} );

			it( 'should emit a warning if the translation is missing', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: []
				} );
				const warningSpy = sinon.spy();

				translationService.on( 'warning', warningSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ]
					}
				};

				translationService._pluralFormsRules = { pl: 'plural=(() => 0)' };

				translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				sinon.assert.calledOnce( warningSpy );
				sinon.assert.calledWithExactly( warningSpy, 'A translation is missing for \'Save\' in the \'pl\' language.' );
			} );

			it( 'should emit an error when there are multiple JS assets', () => {
				const translationService = new MultipleLanguageTranslationService( { mainLanguage: 'pl', additionalLanguages: [] } );
				const errorSpy = sinon.spy();

				translationService.on( 'error', errorSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'ckeditor.js', 'ckeditor1.js' ]
				} );

				sinon.assert.calledOnce( errorSpy );
				sinon.assert.alwaysCalledWithExactly( errorSpy, [
					'Too many JS assets has been found during the compilation. ' +
					'You should add translation assets directly to the application from the `translations` directory or ' +
					'use the `addMainLanguageTranslationsToAllAssets` option to add translations for the main language to all assets ' +
					'or use the `buildAllTranslationsToSeparateFiles` if you want to add translation files on your own.'
				].join( '\n' ) );

				expect( assets ).to.have.length( 1 );
				expect( assets[ 0 ] ).to.have.property( 'outputPath', path.join( 'lang', 'pl.js' ) );
				expect( assets[ 0 ] ).to.have.property( 'outputBody' );
			} );

			it( 'should not emit errors when there are multiple assets and addMainLanguageTranslationsToAllAssets is set to true', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [],
					addMainLanguageTranslationsToAllAssets: true
				} );

				const errorSpy = sinon.spy();

				translationService.on( 'error', errorSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [ 'foo.js', 'bar.js' ]
				} );

				sinon.assert.notCalled( errorSpy );

				expect( assets ).to.have.length( 2 );

				expect( assets[ 0 ] ).to.have.property( 'outputPath', 'foo.js' );
				expect( assets[ 0 ] ).to.have.property( 'outputBody' );

				expect( assets[ 1 ] ).to.have.property( 'outputPath', 'bar.js' );
				expect( assets[ 1 ] ).to.have.property( 'outputBody' );
			} );

			it( 'should not emit errors when there is no asset and the buildAllTranslationsToSeparateFiles is set to true', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [],
					buildAllTranslationsToSeparateFiles: true
				} );

				const errorSpy = sinon.spy();

				translationService.on( 'error', errorSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: []
				} );

				sinon.assert.notCalled( errorSpy );

				expect( assets ).to.have.length( 0 );
			} );

			it( 'should emit all files to a file specified by the `translationsOutputFile` option when it is specified', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [],
					translationsOutputFile: 'foo/bar'
				} );

				const errorSpy = sinon.spy();

				translationService.on( 'error', errorSpy );

				translationService._foundMessageIds = new Set( [
					'Cancel',
					'Save'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ],
						Save: [ 'Zapisz' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'lang',
					compilationAssetNames: [
						'app.js'
					]
				} );

				sinon.assert.notCalled( errorSpy );

				expect( assets ).to.have.length( 1 );

				expect( assets[ 0 ] ).to.have.property( 'outputPath', 'foo/bar' );
				expect( assets[ 0 ] ).to.have.property( 'outputBody' );
				expect( assets[ 0 ].outputBody ).to.have.length.greaterThan( 0 );
			} );

			it( 'should use the `outputDirectory` option for translation assets generated as new files', () => {
				const translationService = new MultipleLanguageTranslationService( {
					mainLanguage: 'pl',
					additionalLanguages: [ 'en' ]
				} );
				const spy = sinon.spy();

				translationService.on( 'warning', spy );

				translationService._foundMessageIds = new Set( [
					'Cancel'
				] );

				translationService._translationDictionaries = {
					pl: {
						Cancel: [ 'Anuluj' ]
					},
					en: {
						Cancel: [ 'Cancel' ]
					}
				};

				const assets = translationService.getAssets( {
					outputDirectory: 'custom-lang-path',
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				expect( assets[ 0 ].outputPath ).to.equal( 'ckeditor.js' );
				expect( assets[ 1 ].outputPath ).to.equal( path.join( 'custom-lang-path', 'en.js' ) );
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

				expect( translationService._translationDictionaries ).to.deep.equal( {
					en: {
						'Save': [ 'Save' ]
					}
				} );
			} );
		} );

		describe( 'integration tests', () => {
			it( 'should build executable translation assets', () => {
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
					compilationAssetNames: [ 'ckeditor.js' ]
				} );

				expect( assets ).to.have.length( 2 );
				expect( assets[ 0 ] ).to.have.property( 'outputPath', 'ckeditor.js' );
				expect( assets[ 1 ] ).to.have.property( 'outputPath', path.join( 'lang', 'de.js' ) );

				eval( assets[ 0 ].outputBody );
				eval( assets[ 1 ].outputBody );

				expect( window.CKEDITOR_TRANSLATIONS ).to.deep.equal( {
					pl: {
						dictionary: {
							Save: 'Zapisz'
						}
					},
					de: {
						dictionary: {
							Save: 'Speichern'
						}
					}
				} );
			} );

			// TODO - an integration test for plural rules.
		} );
	} );
} );
