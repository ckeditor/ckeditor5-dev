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
			expect( transformFileOptionToTestGlob( 'ckeditor5' ) ).to.deep.equal( [ '/workspace/tests/**/*.js' ] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5', true ) ).to.deep.equal( [ '/workspace/tests/**/manual/**/*.js' ] );
		} );
	} );

	describe( 'converts "*" to all packages\' files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-*/tests/**/*.js',
				'/workspace/packages/ckeditor-*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-*/tests/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'/workspace/packages/ckeditor-*/tests/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-*/tests/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-*/tests/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts package name to its files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/manual/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'ignores package starting with "!"', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '!engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/*.js',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '!engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.js',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts path to files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/**/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/**/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/**/*.js'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'engine/view/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/view/**/manual/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/view/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/view/**/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/view/**/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts path to file to a single test', () => {
		it( 'for automated tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/**/utils.js',
				'/workspace/packages/ckeditor-alignment/tests/**/utils.js',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/**/utils.js',
				'/workspace/external/*/packages/ckeditor-alignment/tests/**/utils.js'
			] );
		} );

		it( 'for automated tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/utils' ) ).to.deep.equal( [
				'/workspace/tests/**/utils.js'
			] );
		} );

		it( 'for manual tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/**/manual/**/utils.js',
				'/workspace/packages/ckeditor-alignment/tests/**/manual/**/utils.js',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/**/manual/**/utils.js',
				'/workspace/external/*/packages/ckeditor-alignment/tests/**/manual/**/utils.js'
			] );
		} );

		it( 'for manual tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/utils', true ) ).to.deep.equal( [
				'/workspace/tests/**/manual/**/utils.js'
			] );
		} );
	} );
} );
