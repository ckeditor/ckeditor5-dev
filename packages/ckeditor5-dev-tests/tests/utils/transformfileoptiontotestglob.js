/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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

	describe( 'converts "ckeditor5" to the root package tests', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5' ) ).to.deep.equal( [ '/workspace/tests/**/*.{js,ts}' ] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5', true ) ).to.deep.equal( [ '/workspace/tests/**/manual/**/*.{js,ts}' ] );
		} );
	} );

	describe( 'converts "*" to all packages\' files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-*/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-*/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-*/tests/**/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-*/tests/**/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-*/tests/**/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-*/tests/**/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts package name to its files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/**/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/**/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/**/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'ignores package starting with "!"', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '!engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '!engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/**/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts path to files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/view/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/manual', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/view/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts simplified glob to all files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/*/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/view/*/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/*/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/*/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/manual/*.js', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/manual/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/manual/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/manual/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/manual/*.js'
			] );

			expect( transformFileOptionToTestGlob( 'engine/view/manual/*.ts', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/manual/*.ts',
				'/workspace/packages/ckeditor-engine/tests/view/manual/*.ts',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/manual/*.ts',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/manual/*.ts'
			] );

			expect( transformFileOptionToTestGlob( 'engine/view/manual/*.{js,ts}', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/manual/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/view/manual/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/manual/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/manual/*.{js,ts}'
			] );
		} );
	} );
} );
