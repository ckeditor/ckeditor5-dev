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
	describe( 'SingleLanguageTranslationService', () => {
		let SingleLanguageTranslationService, stubs, files, fileContents, sandbox;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				fs: {
					existsSync: path => files.includes( path ),
					readFileSync: path => fileContents[ path ]
				}
			};

			SingleLanguageTranslationService = proxyquire( '../../lib/translations/singlelanguagetranslationservice', {
				'fs': stubs.fs
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'constructor()', () => {
			it( 'should initialize `SingleLanguageTranslationService`', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );

				expect( translationService ).to.be.instanceof( SingleLanguageTranslationService );
			} );
		} );

		describe( 'loadPackage()', () => {
			it( 'should load po file from the package and load translations', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );
				const pathToTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'pl.po' );

				files = [ pathToTranslations ];

				fileContents = {
					[ pathToTranslations ]: [
						'msgctxt "Label for the Save button."',
						'msgid "Save"',
						'msgstr "Zapisz"',
						''
					].join( '\n' )
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( { 'Save': 'Zapisz' } );
			} );

			it( 'should do nothing if the po file does not exist', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );

				files = [];
				fileContents = {};

				translationService.loadPackage( 'pathToPackage' );

				expect( translationService._dictionary ).to.deep.equal( {} );
			} );

			it( 'should load po file from the package only once', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );
				const loadPoFileSpy = sandbox.stub( translationService, '_loadPoFile' );

				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );

				sinon.assert.calledOnce( loadPoFileSpy );
			} );
		} );

		describe( 'translateSource()', () => {
			it( 'should translate t() calls in the code', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );
				const source = 't( \'Cancel\' )';

				translationService._dictionary.Cancel = 'Anuluj';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't(\'Anuluj\');' );
			} );

			it( 'should return original source if there is no t() calls in the code', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );
				const source = 'translate( \'Cancel\' )';

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 'translate( \'Cancel\' )' );
			} );

			it( 'should emit a warning and keep original string if the translation is missing', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );
				const source = 't( \'Cancel\' )';

				const spy = sandbox.spy();
				translationService.on( 'warning', spy );

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 't(\'Cancel\');' );
				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, 'Missing translation for \'Cancel\' for \'pl\' language in file.js.' );
			} );

			it( 'should throw an error when the t is called with the variable', () => {
				const translationService = new SingleLanguageTranslationService( 'pl' );
				const source = 'const cancel = \'Cancel\';t( cancel );';

				const spy = sandbox.spy();
				translationService.on( 'error', spy );

				const result = translationService.translateSource( source, 'file.js' );

				expect( result ).to.equal( 'const cancel = \'Cancel\';t( cancel );' );
				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, 'First t() call argument should be a string literal in file.js.' );
			} );
		} );

		describe( 'getAssets()', () => {
			it( 'should return an empty array', () => {
				const translationService = new SingleLanguageTranslationService( [ 'pl', 'de' ] );
				const assets = translationService.getAssets();

				expect( assets ).to.deep.equal( [] );
			} );
		} );
	} );
} );
