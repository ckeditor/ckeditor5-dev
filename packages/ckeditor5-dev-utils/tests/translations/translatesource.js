/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const translateSource = require( '../../lib/translations/translatesource' );

describe( 'translations', () => {
	describe( 'translateSource()', () => {
		let sandbox, translations;
		const translateString = translationKey => translations[ translationKey ];

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			translations = { 'Cancel': 'Anuluj' };
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should translate t() calls in the code', () => {
			const source = 't( \'Cancel\' )';

			const { output, errors } = translateSource( source, 'file.js', translateString );

			expect( output ).to.equal( 't(\'Anuluj\');' );
			expect( errors.length ).to.equal( 0 );
		} );

		it( 'should return original source if there is no t() calls in the code', () => {
			const source = 'translate( \'Cancel\' )';

			const { output, errors } = translateSource( source, 'file.js', translateString );

			expect( output ).to.equal( 'translate( \'Cancel\' )' );
			expect( errors.length ).to.equal( 0 );
		} );

		it( 'should throw an error when the t is called with the variable', () => {
			const source = 'const cancel = \'Cancel\';t( cancel );';

			const { output, errors } = translateSource( source, 'file.js', translateString );

			expect( output ).to.equal( 'const cancel = \'Cancel\';t( cancel );' );
			expect( errors ).to.deep.equal( [ 'First t() call argument should be a string literal in file.js.' ] );
		} );
	} );
} );
