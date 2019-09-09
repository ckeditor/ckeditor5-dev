/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'dev-tests/utils', () => {
	let transformFileOptionToTestGlob, sandbox;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		transformFileOptionToTestGlob = require( '../../lib/utils/transformfileoptiontotestglob' );

		sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
		sandbox.stub( process, 'cwd' ).returns( '/workspace' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'converts "/" to current package\'s tests', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '/' ) ).to.deep.equal( [ '/workspace/tests/**/*.js' ] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '/', true ) ).to.deep.equal( [ '/workspace/tests/**/manual/**/*.js' ] );
		} );
	} );

	describe( 'converts "*" to all packages\' files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-*/tests/**/*.js',
				'/workspace/packages/ckeditor-*/tests/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'/workspace/packages/ckeditor-*/tests/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts package name to its files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/manual/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'ignores package starting with "!"', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '!engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/*.js',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '!engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.js',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts path to files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/manual', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/manual/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts simplified glob to all files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/*/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/*/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/manual/*.js', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/manual/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/manual/*.js'
			] );
		} );
	} );
} );
