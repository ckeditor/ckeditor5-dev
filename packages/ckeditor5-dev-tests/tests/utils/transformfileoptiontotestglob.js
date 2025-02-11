/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import transformFileOptionToTestGlob from '../../lib/utils/transformfileoptiontotestglob.js';

vi.mock( 'fs' );

describe( 'transformFileOptionToTestGlob()', () => {
	beforeEach( () => {
		vi.spyOn( path, 'join' ).mockImplementation( ( ...chunks ) => chunks.join( '/' ) );
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace' );
		vi.mocked( fs ).statSync.mockReturnValue( { isDirectory: () => true } );
		vi.mocked( fs ).readdirSync.mockReturnValue( [ 'external-directory' ] );
		vi.mocked( fs ).existsSync.mockReturnValue( true );
	} );

	describe( 'converts "ckeditor5" to pattern matching all root package tests', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5' ) ).to.deep.equal( [ '/workspace/tests/**/*.{js,ts}' ] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5', true ) ).to.deep.equal( [ '/workspace/tests/manual/**/*.{js,ts}' ] );
		} );
	} );

	describe( 'converts "*" to pattern matching all packages\' files', () => {
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
				'/workspace/packages/ckeditor5-*/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-*/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts "package-name" to pattern matching all tests from this package', () => {
		it( 'for automated tests (single package)', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'editor-*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-editor-*/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-editor-*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-editor-*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-editor-*/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (single package)', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-engine/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-engine/tests/manual/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'editor-*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-editor-*/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-editor-*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-editor-*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-editor-*/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts "!package-name" to pattern matching all tests except from this package', () => {
		it( 'for automated tests (single exclusion)', () => {
			expect( transformFileOptionToTestGlob( '!engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-!(engine)*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests (multiple exclusions)', () => {
			expect( transformFileOptionToTestGlob( '!(engine|core|basic-styles)' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine|core|basic-styles)*/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor-!(engine|core|basic-styles)*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-!(engine|core|basic-styles)*/tests/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-!(engine|core|basic-styles)*/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (single exclusion)', () => {
			expect( transformFileOptionToTestGlob( '!engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine)*/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-!(engine)*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-!(engine)*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-!(engine)*/tests/manual/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (multiple exclusions)', () => {
			expect( transformFileOptionToTestGlob( '!(engine|core|basic-styles)', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-!(engine|core|basic-styles)*/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-!(engine|core|basic-styles)*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-!(engine|core|basic-styles)*/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-!(engine|core|basic-styles)*/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts "package-name/directory/" to pattern matching all tests from a package (or root) and a subdirectory', () => {
		it( 'for automated tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/memory/' ) ).to.deep.equal( [
				'/workspace/tests/memory/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/utils/**/*.{js,ts}',
				'/workspace/packages/ckeditor-alignment/tests/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-alignment/tests/utils/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/bold*/**/*.{js,ts}',
				'/workspace/packages/ckeditor-basic-styles/tests/bold*/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/bold*/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/bold*/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests (nested directories)', () => {
			expect( transformFileOptionToTestGlob( 'core/editor/utils/' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-core/tests/editor/utils/**/*.{js,ts}',
				'/workspace/packages/ckeditor-core/tests/editor/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-core/tests/editor/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-core/tests/editor/utils/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/memory/', true ) ).to.deep.equal( [
				'/workspace/tests/manual/memory/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/manual/utils/**/*.{js,ts}',
				'/workspace/packages/ckeditor-alignment/tests/manual/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/manual/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-alignment/tests/manual/utils/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/manual/bold*/**/*.{js,ts}',
				'/workspace/packages/ckeditor-basic-styles/tests/manual/bold*/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/manual/bold*/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/manual/bold*/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests (nested directories)', () => {
			expect( transformFileOptionToTestGlob( 'core/editor/utils/', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-core/tests/manual/editor/utils/**/*.{js,ts}',
				'/workspace/packages/ckeditor-core/tests/manual/editor/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-core/tests/manual/editor/utils/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-core/tests/manual/editor/utils/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'converts "package-name/filename" to pattern matching all tests from a package (or root) with specific filename', () => {
		it( 'for automated tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/utils' ) ).to.deep.equal( [
				'/workspace/tests/**/utils.{js,ts}'
			] );
		} );

		it( 'for automated tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/**/utils.{js,ts}',
				'/workspace/packages/ckeditor-alignment/tests/**/utils.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/**/utils.{js,ts}',
				'/workspace/external/*/packages/ckeditor-alignment/tests/**/utils.{js,ts}'
			] );
		} );

		it( 'for automated tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/**/bold*.{js,ts}',
				'/workspace/packages/ckeditor-basic-styles/tests/**/bold*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/**/bold*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/**/bold*.{js,ts}'
			] );
		} );

		it( 'for manual tests (root)', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5/utils', true ) ).to.deep.equal( [
				'/workspace/tests/manual/**/utils.{js,ts}'
			] );
		} );

		it( 'for manual tests (package)', () => {
			expect( transformFileOptionToTestGlob( 'alignment/utils', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-alignment/tests/manual/**/utils.{js,ts}',
				'/workspace/packages/ckeditor-alignment/tests/manual/**/utils.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-alignment/tests/manual/**/utils.{js,ts}',
				'/workspace/external/*/packages/ckeditor-alignment/tests/manual/**/utils.{js,ts}'
			] );
		} );

		it( 'for manual tests (wildcard support)', () => {
			expect( transformFileOptionToTestGlob( 'basic-styles/bold*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-basic-styles/tests/manual/**/bold*.{js,ts}',
				'/workspace/packages/ckeditor-basic-styles/tests/manual/**/bold*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-basic-styles/tests/manual/**/bold*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-basic-styles/tests/manual/**/bold*.{js,ts}'
			] );
		} );
	} );

	describe( 'should return correct glob for external dirs when external dir name passed', () => {
		it( 'for automated tests', () => {
			vi.mocked( fs ).readdirSync.mockReturnValue( [ 'test-external-directory' ] );

			expect( transformFileOptionToTestGlob( 'test-external-directory' ) ).to.deep.equal( [
				'/workspace/external/test-external-directory/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			vi.mocked( fs ).readdirSync.mockReturnValue( [ 'test-external-directory' ] );

			expect( transformFileOptionToTestGlob( 'test-external-directory', true ) ).to.deep.equal( [
				'/workspace/external/test-external-directory/tests/manual/**/*.{js,ts}'
			] );
		} );

		it( 'should not match external directory when isDirectory returns false', () => {
			vi.mocked( fs ).statSync.mockReturnValue( { isDirectory: () => false } );
			vi.mocked( fs ).readdirSync.mockReturnValue( [ 'test-external-file' ] );

			expect( transformFileOptionToTestGlob( 'test-external-directory', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-test-external-directory/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor-test-external-directory/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor5-test-external-directory/tests/manual/**/*.{js,ts}',
				'/workspace/external/*/packages/ckeditor-test-external-directory/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	it( 'should not call readdirSync if directory does not exist', () => {
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		transformFileOptionToTestGlob( 'test-random-directory' );

		expect( vi.mocked( fs ).readdirSync ).not.toHaveBeenCalled();
	} );
} );
