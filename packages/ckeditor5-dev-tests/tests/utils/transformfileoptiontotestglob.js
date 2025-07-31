/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import transformFileOptionToTestGlob from '../../lib/utils/transformfileoptiontotestglob.js';
import { globSync } from 'glob';

vi.mock( 'fs' );
vi.mock( 'glob' );

describe( 'transformFileOptionToTestGlob()', () => {
	beforeEach( () => {
		vi.spyOn( path, 'join' ).mockImplementation( ( ...chunks ) => chunks.join( '/' ) );
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace' );
		vi.mocked( fs ).readdirSync.mockReturnValue( [ 'ckeditor5', 'ckeditor5-engine', 'ckeditor5-alignment', 'ckeditor5-core' ] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages',
			'/workspace/external/repo1/packages',
			'/workspace/external/repo2/packages'
		] );
	} );

	describe( 'converts "*" to pattern matching all packages\' files', () => {
		it( 'for automated tests', () => {
			expect( transformFileOptionToTestGlob( '*' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-core/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests', () => {
			expect( transformFileOptionToTestGlob( '*', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-core/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-core/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-core/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'handles specific package patterns', () => {
		it( 'for automated tests with specific package', () => {
			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests with specific package', () => {
			expect( transformFileOptionToTestGlob( 'engine', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/manual/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests with ckeditor5 package', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests with ckeditor5 package', () => {
			expect( transformFileOptionToTestGlob( 'ckeditor5', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'handles negation patterns', () => {
		it( 'for automated tests with single exclusion', () => {
			expect( transformFileOptionToTestGlob( '!(engine)' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-core/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests with single exclusion', () => {
			expect( transformFileOptionToTestGlob( '!(engine)', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-core/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-core/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-core/tests/manual/**/*.{js,ts}'
			] );
		} );

		it( 'for automated tests with multiple exclusions', () => {
			expect( transformFileOptionToTestGlob( '!(engine|core)' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-alignment/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-alignment/tests/**/*.{js,ts}'
			] );
		} );

		it( 'for manual tests with multiple exclusions', () => {
			expect( transformFileOptionToTestGlob( '!(engine|core)', true ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5/tests/manual/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-alignment/tests/manual/**/*.{js,ts}'
			] );
		} );
	} );

	describe( 'handles different package directories correctly', () => {
		it( 'works with only main packages directory', () => {
			vi.mocked( globSync ).mockReturnValue( [ '/workspace/packages' ] );

			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'works with only external packages directories', () => {
			vi.mocked( globSync ).mockReturnValue( [
				'/workspace/external/repo1/packages',
				'/workspace/external/repo2/packages'
			] );

			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'works with empty packages directory', () => {
			vi.mocked( fs ).readdirSync.mockReturnValue( [] );

			expect( transformFileOptionToTestGlob( 'engine' ) ).to.deep.equal( [] );
		} );
	} );

	describe( 'calls globSync with correct paths', () => {
		it( 'calls globSync with packages and external packages paths', () => {
			transformFileOptionToTestGlob( 'engine' );

			expect( vi.mocked( globSync ) ).toHaveBeenCalledWith( [
				'/workspace/packages',
				'/workspace/external/*/packages'
			] );
		} );
	} );

	describe( 'calls readdirSync for each package directory', () => {
		it( 'calls readdirSync for each package path returned by globSync', () => {
			transformFileOptionToTestGlob( 'engine' );

			expect( vi.mocked( fs ).readdirSync ).toHaveBeenCalledWith( '/workspace/packages' );
			expect( vi.mocked( fs ).readdirSync ).toHaveBeenCalledWith( '/workspace/external/repo1/packages' );
			expect( vi.mocked( fs ).readdirSync ).toHaveBeenCalledWith( '/workspace/external/repo2/packages' );
		} );
	} );

	describe( 'handles different test directory types', () => {
		it( 'uses tests directory for automated tests', () => {
			const result = transformFileOptionToTestGlob( 'engine', false );

			result.forEach( path => {
				expect( path ).to.include( '/tests/**/*.{js,ts}' );
				expect( path ).not.to.include( '/tests/manual/' );
			} );
		} );

		it( 'uses tests/manual directory for manual tests', () => {
			const result = transformFileOptionToTestGlob( 'engine', true );

			result.forEach( path => {
				expect( path ).to.include( '/tests/manual/**/*.{js,ts}' );
			} );
		} );
	} );

	describe( 'returns correct file extensions', () => {
		it( 'includes both .js and .ts extensions', () => {
			const result = transformFileOptionToTestGlob( 'engine' );

			result.forEach( path => {
				expect( path ).to.include( '.{js,ts}' );
			} );
		} );
	} );

	describe( 'handles package name filtering correctly', () => {
		it( 'filters packages by name with ckeditor5- prefix', () => {
			vi.mocked( fs ).readdirSync.mockReturnValue( [ 'ckeditor5-engine', 'ckeditor5-core', 'other-package' ] );

			const result = transformFileOptionToTestGlob( 'ckeditor5-engine' );

			expect( result ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'filters packages by name without ckeditor5- prefix', () => {
			vi.mocked( fs ).readdirSync.mockReturnValue( [ 'ckeditor5-engine', 'ckeditor5-core', 'other-package' ] );

			const result = transformFileOptionToTestGlob( 'engine' );

			expect( result ).to.deep.equal( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-engine/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-engine/tests/**/*.{js,ts}'
			] );
		} );

		it( 'handles negation with package name without ckeditor5- prefix', () => {
			vi.mocked( fs ).readdirSync.mockReturnValue( [ 'ckeditor5-engine', 'ckeditor5-core', 'other-package' ] );

			const result = transformFileOptionToTestGlob( '!(engine)' );

			expect( result ).to.deep.equal( [
				'/workspace/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/packages/other-package/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/external/repo1/packages/other-package/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/ckeditor5-core/tests/**/*.{js,ts}',
				'/workspace/external/repo2/packages/other-package/tests/**/*.{js,ts}'
			] );
		} );
	} );
} );
