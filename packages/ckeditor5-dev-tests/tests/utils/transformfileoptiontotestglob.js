/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'dev-tests/utils', () => {
	let transformFileOptionToTestGlob, sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		transformFileOptionToTestGlob = require( '../../lib/utils/transformfileoptiontotestglob' );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd' ).returns( '/workspace' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'converts "/" to current package\'s tests', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '/' ) ).to.equal( '/workspace/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '/', true ) ).to.equal( '/workspace/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'converts "*" to all packages\' files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '*' ) ).to.equal( '/workspace/packages/ckeditor5-*/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '*', true ) )
				.to.equal( '/workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'converts package name to its files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) )
				.to.equal( '/workspace/packages/ckeditor5-engine/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) )
				.to.equal( '/workspace/packages/ckeditor5-engine/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'ignores package starting with "!"', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '!engine' ) )
				.to.equal( '/workspace/packages/ckeditor5-!(engine)*/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '!engine', true ) )
				.to.equal( '/workspace/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'converts path to files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view' ) )
				.to.equal( '/workspace/packages/ckeditor5-engine/tests/view/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/manual', true ) )
				.to.equal( '/workspace/packages/ckeditor5-engine/tests/view/manual/**/*.js' );
		} );
	} );

	describe( 'converts simplified glob to all files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/*' ) )
				.to.equal( '/workspace/packages/ckeditor5-engine/tests/view/*/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/manual/*.js', true ) )
				.to.equal( '/workspace/packages/ckeditor5-engine/tests/view/manual/*.js' );
		} );
	} );
} );
