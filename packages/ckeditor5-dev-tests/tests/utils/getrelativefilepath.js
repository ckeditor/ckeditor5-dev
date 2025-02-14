/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import getRelativeFilePath from '../../lib/utils/getrelativefilepath.js';

describe( 'getRelativeFilePath()', () => {
	describe( 'Unix paths', () => {
		beforeEach( () => {
			vi.spyOn( path, 'join' ).mockImplementation( ( ...args ) => args.join( '/' ) );
		} );

		it( 'returns path which starts with package name (simple check)', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/Users/foo' );

			checkPath( '/Users/foo/packages/ckeditor5-foo/tests/manual/foo.js', 'ckeditor5-foo/tests/manual/foo.js' );
		} );

		it( 'returns path which starts with package name (workspace directory looks like package name)', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/Users/foo/ckeditor5-workspace/ckeditor5' );

			checkPath(
				'/Users/foo/ckeditor5-workspace/ckeditor5/packages/ckeditor5-foo/tests/manual/foo.js',
				'ckeditor5-foo/tests/manual/foo.js'
			);
		} );

		it( 'returns a proper path for "ckeditor-" prefix', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/space' );

			checkPath( '/work/space/packages/ckeditor-foo/tests/manual/foo.js', 'ckeditor-foo/tests/manual/foo.js' );
		} );

		it( 'returns a proper path for "ckeditor-" prefix and "ckeditor.js" file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/space' );

			checkPath( '/work/space/packages/ckeditor-foo/tests/manual/ckeditor.js', 'ckeditor-foo/tests/manual/ckeditor.js' );
		} );

		it( 'returns a proper path to from the main (root) package', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/space' );
			checkPath( '/work/space/packages/ckeditor5/tests/manual/foo.js', 'ckeditor5/tests/manual/foo.js' );
		} );

		it( 'returns a proper path for "ckeditor5.js" file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/space' );
			checkPath(
				'/work/space/packages/ckeditor5-editor-a/tests/manual/ckeditor5.js',
				'ckeditor5-editor-a/tests/manual/ckeditor5.js'
			);
		} );

		it( 'returns a proper path for "ckeditor.js" file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/work/space' );
			checkPath(
				'/work/space/packages/ckeditor5-editor-a/tests/manual/ckeditor.js',
				'ckeditor5-editor-a/tests/manual/ckeditor.js' );
		} );
	} );

	describe( 'Windows paths', () => {
		beforeEach( () => {
			vi.spyOn( path, 'join' ).mockImplementation( ( ...args ) => args.join( '\\' ) );
		} );

		it( 'returns path which starts with package name (simple check)', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\work\\space' );

			checkPath( 'C:\\work\\space\\packages\\ckeditor5-foo\\tests\\manual\\foo.js', 'ckeditor5-foo\\tests\\manual\\foo.js' );
		} );

		it( 'returns path which starts with package name (workspace directory looks like package name)', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\Document and settings\\foo\\ckeditor5-workspace\\ckeditor5' );

			checkPath(
				'C:\\Document and settings\\foo\\ckeditor5-workspace\\ckeditor5\\packages\\ckeditor5-foo\\tests\\manual\\foo.js',
				'ckeditor5-foo\\tests\\manual\\foo.js'
			);
		} );

		it( 'returns a proper path for "ckeditor-" prefix', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\work\\space' );

			checkPath( 'C:\\work\\space\\packages\\ckeditor-foo\\tests\\manual\\foo.js', 'ckeditor-foo\\tests\\manual\\foo.js' );
		} );

		it( 'returns a proper path for "ckeditor-" prefix and "ckeditor.js" file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\work\\space' );

			checkPath(
				'C:\\work\\space\\packages\\ckeditor-foo\\tests\\manual\\ckeditor.js',
				'ckeditor-foo\\tests\\manual\\ckeditor.js'
			);
		} );

		it( 'returns a proper path to from the main (root) package', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\work\\space' );
			checkPath( 'C:\\work\\space\\tests\\manual\\foo.js', 'ckeditor5\\tests\\manual\\foo.js' );
		} );

		it( 'returns a proper path for "ckeditor5.js" file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\work\\space' );
			checkPath(
				'C:\\work\\space\\packages\\ckeditor5-editor-a\\tests\\manual\\ckeditor5.js',
				'ckeditor5-editor-a\\tests\\manual\\ckeditor5.js'
			);
		} );

		it( 'returns a proper path for "ckeditor.js" file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( 'C:\\work\\space' );
			checkPath(
				'C:\\work\\space\\packages\\ckeditor5-editor-a\\tests\\manual\\ckeditor.js',
				'ckeditor5-editor-a\\tests\\manual\\ckeditor.js'
			);
		} );
	} );
} );

function checkPath( filePath, expectedPath ) {
	expect( getRelativeFilePath( filePath ) ).to.equal( expectedPath );
}
