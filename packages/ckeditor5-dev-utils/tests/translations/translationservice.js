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
const TranslationService = require( '../../lib/translations/translationservice' );

describe( 'translations', () => {
	describe( 'TranslationService', () => {
		let translationService;
		let sandbox;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();
			translationService = new TranslationService();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'loadPackage()', () => {
			it( 'should load po file from the package', () => {
				const loadPoFileSpy = sinon.spy();
				sandbox.stub( translationService, '_loadPoFile', loadPoFileSpy );

				translationService.loadPackage( 'pathToPackage' );

				sinon.assert.calledWith(
					loadPoFileSpy,
					path.join( 'pathToPackage', 'lang', 'translations', this.language + '.po' )
				);
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
		} );
	} );
} );
