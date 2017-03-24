/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const path = require( 'path' );

describe.only( 'dev-tests/utils', () => {
	let fileOptionToGlob;

	beforeEach( () => {
		sinon.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) );
		sinon.stub( process, 'cwd', () => '/workspace' );

		fileOptionToGlob = require( '../../lib/utils/fileoptiontoglob' );
	} );

	afterEach( () => {
		path.join.restore();
		process.cwd.restore();
	} );

	describe( 'converts "/" to current package\'s tests', () => {
		it( 'for automated tests', () => {
			expect( fileOptionToGlob( '/' ) ).to.equal( '/workspace/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( fileOptionToGlob( '/', true ) ).to.equal( '/workspace/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'converts "*" to all packages\' files', () => {
		it( 'for automated tests', () => {
			expect( fileOptionToGlob( '*' ) ).to.equal( '/workspace/packages/ckeditor5-*/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( fileOptionToGlob( '*', true ) ).to.equal( '/workspace/packages/ckeditor5-*/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'converts package name to its files', () => {
		it( 'for automated tests', () => {
			expect( fileOptionToGlob( 'engine' ) ).to.equal( '/workspace/packages/ckeditor5-engine/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( fileOptionToGlob( 'engine', true ) ).to.equal( '/workspace/packages/ckeditor5-engine/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'ignores package starting with "!"', () => {
		it( 'for automated tests', () => {
			expect( fileOptionToGlob( '!engine' ) ).to.equal( '/workspace/packages/ckeditor5-!(engine)*/tests/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( fileOptionToGlob( '!engine', true ) ).to.equal( '/workspace/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.js' );
		} );
	} );

	describe( 'converts path to files', () => {
		it( 'for automated tests', () => {
			expect( fileOptionToGlob( 'engine/view' ) ).to.equal( '/workspace/packages/ckeditor5-engine/tests/view/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( fileOptionToGlob( 'engine/view', true ) ).to.equal( '/workspace/packages/ckeditor5-engine/tests/view/manual/**/*.js' );
		} );
	} );

	describe( 'converts simplified glob to all files', () => {
		it( 'for automated tests', () => {
			expect( fileOptionToGlob( 'engine/view/*' ) ).to.equal( '/workspace/packages/ckeditor5-engine/tests/view/*/**/*.js' );
		} );

		it( 'for manual tests', () => {
			expect( fileOptionToGlob( 'engine/view/*.js', true ) ).to.equal( '/workspace/packages/ckeditor5-engine/tests/view/manual/*.js' );
		} );
	} );
} );
