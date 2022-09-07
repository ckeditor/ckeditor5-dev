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

	describe( 'converts "ckeditor5" to pattern matching all root package tests', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5' ) ).to.deep.equal( [ '/workspace/tests/**/*.js' ] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5', true ) ).to.deep.equal( [ '/workspace/tests/manual/**/*.js' ] );
		} );
	} );

	describe( 'converts "*" to pattern matching all packages\' files', () => {
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
				'/workspace/packages/ckeditor5-*/tests/manual/**/*.js',
				'/workspace/packages/ckeditor-*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-*/tests/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts "foo" to pattern matching all tests from a package', () => {
		it( 'for automated tests (single package)', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/**/*.js'
			] );
		} );

		it( 'for automated tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'build-*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-build-*/tests/**/*.js',
				'/workspace/packages/ckeditor-build-*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-build-*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-build-*/tests/**/*.js'
			] );
		} );

		it( 'for manual tests (single package)', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/manual/**/*.js',
				'/workspace/packages/ckeditor-engine/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-engine/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-engine/tests/manual/**/*.js'
			] );
		} );

		it( 'for manual tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'build-*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-build-*/tests/manual/**/*.js',
				'/workspace/packages/ckeditor-build-*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-build-*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-build-*/tests/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts "!foo" to pattern matching all tests except from a package', () => {
		it( 'for automated tests (single exclusion)', () => {
			expect( transformFileOptionToTestGlob( '!engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/*.js',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/**/*.js'
			] );
		} );

		it( 'for automated tests (multiple exclusions)', () => {
			expect( transformFileOptionToTestGlob( '!(engine|core|basic-styles)' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine|core|basic-styles)*/tests/**/*.js',
				'/workspace/packages/ckeditor-!(engine|core|basic-styles)*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor5-!(engine|core|basic-styles)*/tests/**/*.js',
				'/workspace/external/*/packages/ckeditor-!(engine|core|basic-styles)*/tests/**/*.js'
			] );
		} );

		it( 'for manual tests (single exclusion)', () => {
			expect( transformFileOptionToTestGlob( '!engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/manual/**/*.js',
				'/workspace/packages/ckeditor-!(engine)*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/manual/**/*.js'
			] );
		} );

		it( 'for manual tests (multiple exclusions)', () => {
			expect( transformFileOptionToTestGlob( '!(engine|core|basic-styles)', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine|core|basic-styles)*/tests/manual/**/*.js',
				'/workspace/packages/ckeditor-!(engine|core|basic-styles)*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor5-!(engine|core|basic-styles)*/tests/manual/**/*.js',
				'/workspace/external/*/packages/ckeditor-!(engine|core|basic-styles)*/tests/manual/**/*.js'
			] );
		} );
	} );

	describe( 'converts "foo/bar/" to pattern matching all tests from a package (or root) and a subdirectory', () => {
		it( 'for automated tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/memory/' ) ).to.deep.equal( [
				'/workspace/tests/memory/**/*.js'
			] );
		} );

		it( 'for automated tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/utils/**/*.js',
				'/workspace/packages/ckeditor-alignment/tests/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor-alignment/tests/utils/**/*.js'
			] );
		} );

		it( 'for automated tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold*/**/*.js',
				'/workspace/packages/ckeditor-basic-styles/tests/bold*/**/*.js',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/bold*/**/*.js',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/bold*/**/*.js'
			] );
		} );

		it( 'for automated tests (nested directories)', () => {
			expect( transformFileOptionToTestGlob( 'core/editor/utils/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-core/tests/editor/utils/**/*.js',
				'/workspace/packages/ckeditor-core/tests/editor/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor5-core/tests/editor/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor-core/tests/editor/utils/**/*.js'
			] );
		} );

		it( 'for manual tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/memory/', true ) ).to.deep.equal( [
				'/workspace/tests/manual/memory/**/*.js'
			] );
		} );

		it( 'for manual tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/manual/utils/**/*.js',
				'/workspace/packages/ckeditor-alignment/tests/manual/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/manual/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor-alignment/tests/manual/utils/**/*.js'
			] );
		} );

		it( 'for manual tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/manual/bold*/**/*.js',
				'/workspace/packages/ckeditor-basic-styles/tests/manual/bold*/**/*.js',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/manual/bold*/**/*.js',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/manual/bold*/**/*.js'
			] );
		} );

		it( 'for manual tests (nested directories)', () => {
			expect( transformFileOptionToTestGlob( 'core/editor/utils/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-core/tests/manual/editor/utils/**/*.js',
				'/workspace/packages/ckeditor-core/tests/manual/editor/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor5-core/tests/manual/editor/utils/**/*.js',
				'/workspace/external/*/packages/ckeditor-core/tests/manual/editor/utils/**/*.js'
			] );
		} );
	} );

	describe( 'converts "foo/bar" to pattern matching all tests from a package (or root) with specific filename', () => {
		it( 'for automated tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/utils' ) ).to.deep.equal( [
				'/workspace/tests/**/utils.js'
			] );
		} );

		it( 'for automated tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/**/utils.js',
				'/workspace/packages/ckeditor-alignment/tests/**/utils.js',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/**/utils.js',
				'/workspace/external/*/packages/ckeditor-alignment/tests/**/utils.js'
			] );
		} );

		it( 'for automated tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/**/bold*.js',
				'/workspace/packages/ckeditor-basic-styles/tests/**/bold*.js',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/**/bold*.js',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/**/bold*.js'
			] );
		} );

		it( 'for manual tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/utils', true ) ).to.deep.equal( [
				'/workspace/tests/manual/**/utils.js'
			] );
		} );

		it( 'for manual tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/manual/**/utils.js',
				'/workspace/packages/ckeditor-alignment/tests/manual/**/utils.js',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/manual/**/utils.js',
				'/workspace/external/*/packages/ckeditor-alignment/tests/manual/**/utils.js'
			] );
		} );

		it( 'for manual tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/manual/**/bold*.js',
				'/workspace/packages/ckeditor-basic-styles/tests/manual/**/bold*.js',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/manual/**/bold*.js',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/manual/**/bold*.js'
			] );
		} );
	} );
} );
