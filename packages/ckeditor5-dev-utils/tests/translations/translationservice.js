/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const path = require( 'path' );
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'translations', () => {
	describe( 'TranslationService', () => {
		const sandbox = sinon.sandbox.create();
		let translationService, TranslationService, stubs;
		let files, fileContents;

		beforeEach( () => {
			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				logger: {
					info: sandbox.stub(),
					warning: sandbox.stub(),
					error: sandbox.stub()
				},
				fs: {
					existsSync: path => files.includes( path ),
					readFileSync: path => fileContents[ path ]
				}
			};

			mockery.registerMock( 'fs', stubs.fs );

			TranslationService = proxyquire( '../../lib/translations/translationservice', {
				'../logger': () => stubs.logger,
			} );

			translationService = new TranslationService( 'pl' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'constructor()', () => {
			it( 'should be able to use custom function that returns path to the po file', () => {
				const pathToTranslations = path.join( 'customPathToPackage', 'lang', 'translations', 'pl.po' );

				files = [ pathToTranslations ];

				fileContents = {
					[ pathToTranslations ]: [
						`msgctxt "Label for the Save button."`,
						`msgid "Save"`,
						`msgstr "Zapisz"`,
						''
					].join( '\n' )
				};

				translationService = new TranslationService( 'pl', {
					getPathToPoFile: ( pathToPackage, languageCode ) => path.join( pathToPackage, 'lang', 'translations', `${ languageCode }.po` )
				} );

				translationService.loadPackage( 'customPathToPackage' );

				expect( Array.from( translationService.dictionary ) ).to.deep.equal( [
					[ 'Save', 'Zapisz' ]
				] );
			} );
		} );

		describe( 'loadPackage()', () => {
			it( 'should load po file from the package and load translations', () => {
				const pathToTranslations = path.join( 'pathToPackage', 'lang', 'translations', 'pl.po' );

				files = [ pathToTranslations ];

				fileContents = {
					[ pathToTranslations ]: [
						`msgctxt "Label for the Save button."`,
						`msgid "Save"`,
						`msgstr "Zapisz"`,
						''
					].join( '\n' )
				};

				translationService.loadPackage( 'pathToPackage' );

				expect( Array.from( translationService.dictionary ) ).to.deep.equal( [
					[ 'Save', 'Zapisz' ]
				] );
			} );

			it( 'should do nothing if the po file does not exist', () => {
				files = [];
				fileContents = {};

				translationService.loadPackage( 'pathToPackage' );

				expect( Array.from( translationService.dictionary ) ).to.deep.equal( [] );
			} );

			it( 'should load po file from the package only once', () => {
				const loadPoFileSpy = sinon.spy();
				sandbox.stub( translationService, '_loadPoFile', loadPoFileSpy );

				translationService.loadPackage( 'pathToPackage' );
				translationService.loadPackage( 'pathToPackage' );

				sinon.assert.calledOnce( loadPoFileSpy );
			} );
		} );

		describe( 'translateSource()', () => {
			it( 'should translate t() calls in the code', () => {
				const source = `t( 'Cancel' )`;

				translationService.dictionary.set( 'Cancel', 'Anuluj' );

				const result = translationService.translateSource( source );

				expect( result ).to.equal( `t('Anuluj');` );
			} );

			it( 'should return original source if there is no t() calls in the code', () => {
				const source = `translate( 'Cancel' )`;

				const result = translationService.translateSource( source );

				expect( result ).to.equal( `translate( 'Cancel' )` );
			} );

			it( 'should lg the error and keep original string if the translation misses', () => {
				const source = `t( 'Cancel' )`;
				const result = translationService.translateSource( source );

				expect( result ).to.equal( `t('Cancel');` );
				sinon.assert.calledOnce( stubs.logger.error );
				sinon.assert.calledWithExactly( stubs.logger.error, 'Missing translation for: Cancel.' );
			} );

			it( 'should throw an error when the t is called with the variable', () => {
				const source = `const cancel = 'Cancel';t( cancel );`;

				const result = translationService.translateSource( source );

				expect( result ).to.equal( `const cancel = 'Cancel';t( cancel );` );
				sinon.assert.calledOnce( stubs.logger.error );
				sinon.assert.calledWithExactly( stubs.logger.error, 'First t() call argument should be a string literal.' );
			} );
		} );
	} );
} );
